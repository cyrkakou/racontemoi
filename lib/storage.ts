import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { and, eq, isNull, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { files, users } from "@/lib/db/schema";
import type { ProbeResult } from "./database";

export function getStorageRoot(): string {
  const configured = process.env.PERSISTENT_STORAGE_DIR;
  if (process.env.NODE_ENV === "production" && !configured) {
    throw new Error("STORAGE_NOT_CONFIGURED");
  }
  return path.resolve(/* turbopackIgnore: true */ configured ?? ".data");
}

export async function checkStorage(): Promise<ProbeResult> {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();
  let testFile: string | undefined;

  try {
    const directory = getStorageRoot();
    await mkdir(directory, { recursive: true, mode: 0o700 });

    const marker = randomUUID();
    testFile = path.join(directory, `.health-${randomUUID()}.tmp`);
    await writeFile(testFile, marker, { encoding: "utf8", flag: "wx", mode: 0o600 });
    const stored = await readFile(/* turbopackIgnore: true */ testFile, "utf8");

    if (stored !== marker) {
      throw new Error("STORAGE_CONTENT_MISMATCH");
    }

    return {
      status: "ok",
      checkedAt,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    const notConfigured =
      error instanceof Error && error.message === "STORAGE_NOT_CONFIGURED";
    return {
      status: "error",
      checkedAt,
      latencyMs: Math.round(performance.now() - startedAt),
      code: notConfigured ? "NOT_CONFIGURED" : "CONNECTION_FAILED",
    };
  } finally {
    if (testFile) {
      await unlink(testFile).catch(() => undefined);
    }
  }
}

// ---------- StorageProvider ----------

export type FileKind = "cover" | "character_ref" | "illustration" | "pdf" | "tmp";
export type StoredFile = typeof files.$inferSelect;

const MAX_FILE_BYTES = 25 * 1024 * 1024; // 25 MiB
const MIME_EXT: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

function extForMime(mime: string): string {
  return MIME_EXT[mime] ?? "bin";
}

async function quotaCheck(userId: number, incomingBytes: number) {
  const db = getDb();
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!u) throw new Error("USER_NOT_FOUND");
  if (u.storageBytesUsed + incomingBytes > u.storageQuotaBytes) {
    throw new Error("STORAGE_QUOTA_EXCEEDED");
  }
  return u;
}

export async function putFile(opts: {
  data: Buffer | string;
  mime: string;
  kind: FileKind;
  ownerUserId?: number | null;
  projectId?: number | null;
  expiresAt?: Date | null;
}): Promise<StoredFile> {
  const buf = Buffer.isBuffer(opts.data) ? opts.data : Buffer.from(opts.data, "utf8");
  if (buf.byteLength > MAX_FILE_BYTES) throw new Error("FILE_TOO_LARGE");
  if (opts.ownerUserId) await quotaCheck(opts.ownerUserId, buf.byteLength);

  const id = randomUUID();
  const storageKey = `${opts.kind}/${id}.${extForMime(opts.mime)}`;
  const abs = path.join(getStorageRoot(), storageKey);
  await mkdir(path.dirname(abs), { recursive: true, mode: 0o700 });
  await writeFile(abs, buf, { mode: 0o600 });

  const sha256 = createHash("sha256").update(buf).digest("hex");
  const db = getDb();
  await db.insert(files).values({
    id,
    ownerUserId: opts.ownerUserId ?? null,
    projectId: opts.projectId ?? null,
    kind: opts.kind,
    storageKey,
    mime: opts.mime,
    bytes: buf.byteLength,
    sha256,
    expiresAt: opts.expiresAt ?? null,
  });

  if (opts.ownerUserId) {
    await db
      .update(users)
      .set({ storageBytesUsed: sql`${users.storageBytesUsed} + ${buf.byteLength}` })
      .where(eq(users.id, opts.ownerUserId));
  }

  const [row] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  return row;
}

export async function readStoredFile(
  fileId: string,
): Promise<{ file: StoredFile; data: Buffer } | null> {
  const db = getDb();
  const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!file) return null;
  const abs = path.join(/* turbopackIgnore: true */ getStorageRoot(), file.storageKey);
  const data = await readFile(/* turbopackIgnore: true */ abs);
  return { file, data };
}

export async function deleteStoredFile(fileId: string): Promise<void> {
  const db = getDb();
  const [file] = await db.select().from(files).where(eq(files.id, fileId)).limit(1);
  if (!file) return;
  await unlink(path.join(/* turbopackIgnore: true */ getStorageRoot(), file.storageKey)).catch(() => undefined);
  await db.delete(files).where(eq(files.id, fileId));
  if (file.ownerUserId) {
    await db
      .update(users)
      .set({
        storageBytesUsed: sql`GREATEST(0, ${users.storageBytesUsed} - ${file.bytes})`,
      })
      .where(eq(users.id, file.ownerUserId));
  }
}

export async function deleteProjectFiles(projectId: number): Promise<void> {
  const db = getDb();
  const rows = await db
    .select({ id: files.id })
    .from(files)
    .where(and(eq(files.projectId, projectId), isNull(files.expiresAt)));
  for (const r of rows) await deleteStoredFile(r.id);
}
