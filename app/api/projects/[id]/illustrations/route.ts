import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import { getProjectForUser } from "@/lib/services/projects";
import {
  approvePageAsset,
  listPageAssets,
  requestIllustrationBatch,
  requestPageIllustration,
} from "@/lib/services/illustrations";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

async function ownedProject(userId: string, id: string) {
  const projectId = Number(id);
  if (!Number.isInteger(projectId) || projectId <= 0) return null;
  return getProjectForUser(Number(userId), projectId);
}

/** GET — all illustration assets for the project */
export async function GET(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const project = await ownedProject(user.id, id);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);
  const assets = await listPageAssets(project.id);
  return privateJson({ assets });
}

/**
 * POST { action: "batch" } | { action: "page", pageNo, regenerate? }
 * | { action: "approve", pageNo, assetId }
 */
export async function POST(request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const project = await ownedProject(user.id, id);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);
  if (!project.approvedStoryVersionId) {
    return privateJson({ error: "STORY_NOT_APPROVED" }, 409);
  }

  let body: { action?: string; pageNo?: number; assetId?: string; regenerate?: boolean };
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "INVALID_JSON" }, 400);
  }

  if (body.action === "batch") {
    const { job, created } = await requestIllustrationBatch(project.id);
    return privateJson({ ok: true, jobId: job.id, created }, 202);
  }

  if (body.action === "page" && Number.isInteger(body.pageNo)) {
    const { job, created } = await requestPageIllustration(
      project.id,
      Number(body.pageNo),
      body.regenerate === true,
    );
    return privateJson({ ok: true, jobId: job.id, created }, created ? 202 : 200);
  }

  if (body.action === "approve" && Number.isInteger(body.pageNo) && typeof body.assetId === "string") {
    const ok = await approvePageAsset(project.id, Number(body.pageNo), body.assetId);
    return ok ? privateJson({ ok: true }) : privateJson({ error: "ASSET_NOT_FOUND" }, 404);
  }

  return privateJson({ error: "BAD_ACTION" }, 400);
}
