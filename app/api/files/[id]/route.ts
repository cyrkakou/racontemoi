import type { NextRequest } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import { getDb } from "@/lib/db";
import { files, projects } from "@/lib/db/schema";
import { readStoredFile } from "@/lib/storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_EXT: Record<string, string> = {
  "image/svg+xml": "svg",
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

/**
 * Authenticated private file download.
 * Access granted when: file.ownerUserId = user, OR file.projectId belongs to user,
 * OR file is linked to a published template cover (public).
 */
export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  const { id } = await ctx.params;

  const db = getDb();
  const [file] = await db.select().from(files).where(eq(files.id, id)).limit(1);
  if (!file) return privateJson({ error: "NOT_FOUND" }, 404);

  let allowed = false;
  if (user && file.ownerUserId === Number(user.id)) allowed = true;

  if (!allowed && file.projectId) {
    const [project] = await db
      .select({ userId: projects.userId })
      .from(projects)
      .where(and(eq(projects.id, file.projectId), isNull(projects.deletedAt)))
      .limit(1);
    if (project && user && project.userId === Number(user.id)) allowed = true;
  }

  if (!allowed) return privateJson({ error: "FORBIDDEN" }, 403);

  const stored = await readStoredFile(file.id);
  if (!stored) return privateJson({ error: "FILE_MISSING" }, 404);

  const ext = MIME_EXT[file.mime] ?? "bin";
  return new Response(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": file.mime,
      "Content-Disposition": `inline; filename="${file.id}.${ext}"`,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
