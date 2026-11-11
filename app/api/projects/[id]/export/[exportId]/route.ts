import type { NextRequest } from "next/server";
import { eq, and } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import { getProjectForUser } from "@/lib/services/projects";
import { readStoredFile } from "@/lib/storage";
import { getDb } from "@/lib/db";
import { exportJobs, files } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string; exportId: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id, exportId } = await ctx.params;
  const projectId = Number(id);
  const exportJobId = Number(exportId);
  if (!Number.isInteger(projectId) || !Number.isInteger(exportJobId)) {
    return privateJson({ error: "BAD_ID" }, 400);
  }
  const project = await getProjectForUser(Number(user.id), projectId);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);

  const db = getDb();
  const [exp] = await db
    .select()
    .from(exportJobs)
    .where(and(eq(exportJobs.id, exportJobId), eq(exportJobs.projectId, projectId)))
    .limit(1);
  if (!exp?.fileId || exp.status !== "ready") {
    return privateJson({ error: "NOT_READY" }, 404);
  }

  const [file] = await db.select().from(files).where(eq(files.id, exp.fileId)).limit(1);
  const stored = file ? await readStoredFile(file.id) : null;
  if (!stored) return privateJson({ error: "FILE_MISSING" }, 404);

  const slug = project.title.replace(/[^a-zA-Z0-9À-ÿ]+/g, "-").slice(0, 60);
  return new Response(new Uint8Array(stored.data), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="racontemoi-${slug}.pdf"`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
