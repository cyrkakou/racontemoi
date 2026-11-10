import { randomUUID } from "node:crypto";
import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import type { ProbeResult } from "./database";

function getStorageDirectory(): string {
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
    const directory = getStorageDirectory();
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
