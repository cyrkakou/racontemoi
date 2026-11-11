import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import { getProjectForUser } from "@/lib/services/projects";
import {
  approveStoryVersion,
  listStoryVersions,
  requestNarrative,
} from "@/lib/services/narrative";

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
  const versions = await listStoryVersions(project.id);
  return privateJson({ versions });
}

/** POST { action: "generate" } or { action: "approve", versionId } */
export async function POST(request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const project = await ownedProject(user.id, id);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);

  let body: { action?: string; versionId?: number };
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "INVALID_JSON" }, 400);
  }

  if (body.action === "generate") {
    const submissionId = typeof (body as { submissionId?: unknown }).submissionId === "string"
      ? (body as { submissionId: string }).submissionId.slice(0, 64)
      : undefined;
    const { job, created } = await requestNarrative(project.id, "deterministic", submissionId);
    return privateJson({ ok: true, jobId: job.id, created }, created ? 202 : 200);
  }

  if (body.action === "approve" && Number.isInteger(body.versionId)) {
    const ok = await approveStoryVersion(project.id, Number(body.versionId));
    return ok ? privateJson({ ok: true }) : privateJson({ error: "VERSION_NOT_FOUND" }, 404);
  }

  return privateJson({ error: "BAD_ACTION" }, 400);
}
