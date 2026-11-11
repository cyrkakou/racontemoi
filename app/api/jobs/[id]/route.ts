import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import { getDb } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getProjectForUser } from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const jobId = Number(id);
  if (!Number.isInteger(jobId) || jobId <= 0) return privateJson({ error: "BAD_ID" }, 400);

  const db = getDb();
  const [job] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.id, jobId))
    .limit(1);
  if (!job) return privateJson({ error: "NOT_FOUND" }, 404);
  if (job.projectId) {
    const project = await getProjectForUser(Number(user.id), job.projectId);
    if (!project) return privateJson({ error: "FORBIDDEN" }, 403);
  }
  return privateJson({
    job: {
      id: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      lastError: job.lastError,
      attempts: job.attempts,
    },
  });
}
