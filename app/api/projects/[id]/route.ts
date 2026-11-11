import type { NextRequest } from "next/server";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import {
  getProjectCharacters,
  getProjectForUser,
  getProjectPages,
  softDeleteProject,
} from "@/lib/services/projects";
import { listStoryVersions } from "@/lib/services/narrative";
import { listPageAssets } from "@/lib/services/illustrations";
import { listJobsForProject } from "@/lib/services/jobs";
import { listExports } from "@/lib/services/exports";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

function parseId(raw: string): number | null {
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const projectId = parseId(id);
  if (!projectId) return privateJson({ error: "BAD_ID" }, 400);

  const project = await getProjectForUser(Number(user.id), projectId);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);

  const [pages, characters, stories, assets, jobs, exports_] = await Promise.all([
    getProjectPages(projectId),
    getProjectCharacters(projectId),
    listStoryVersions(projectId),
    listPageAssets(projectId),
    listJobsForProject(projectId, 10),
    listExports(projectId),
  ]);

  return privateJson({ project, pages, characters, stories, assets, jobs, exports: exports_ });
}

export async function DELETE(_request: NextRequest, ctx: Ctx) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const projectId = parseId(id);
  if (!projectId) return privateJson({ error: "BAD_ID" }, 400);

  const ok = await softDeleteProject(Number(user.id), projectId);
  return ok ? privateJson({ ok: true }) : privateJson({ error: "NOT_FOUND" }, 404);
}
