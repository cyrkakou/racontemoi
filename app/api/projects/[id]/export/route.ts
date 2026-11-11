import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import { getProjectForUser } from "@/lib/services/projects";
import { listExports, requestExport } from "@/lib/services/exports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function ownedProject(userId: string, id: string) {
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) return null;
  return getProjectForUser(Number(userId), projectId);
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const project = await ownedProject(user.id, id);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);
  const exports_ = await listExports(project.id);
  return privateJson({ exports: exports_ });
}

export async function POST(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const project = await ownedProject(user.id, id);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);
  if (!project.approvedStoryVersionId) {
    return privateJson({ error: "STORY_NOT_APPROVED" }, 409);
  }
  const { job, created } = await requestExport(project.id);
  return privateJson({ ok: true, jobId: job.id, created }, 202);
}
