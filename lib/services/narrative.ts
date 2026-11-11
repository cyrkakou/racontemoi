import { desc, eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { bookTemplateVersions, projects, storyVersions } from "@/lib/db/schema";
import { getTextProvider } from "@/lib/ai";
import { toProviderInput, type Personalization } from "./projects";
import { completeJob, progressJob, startJob, type JobRow } from "./jobs";
import { recordCost } from "./budget";
import { parseJson } from "@/lib/utils";

import { enqueueJob } from "./jobs";

export async function requestNarrative(
  projectId: number,
  provider: "deterministic" | "ai" = "deterministic",
  submissionId?: string,
) {
  return enqueueJob({
    type: "narrative",
    projectId,
    // submissionId scopes idempotency to one user intent — regeneration is allowed
    payload: { projectId, provider, submissionId: submissionId ?? crypto.randomUUID() },
    priority: 50,
  });
}

export async function handleNarrativeJob(job: JobRow): Promise<void> {
  const db = getDb();
  const projectId = Number((job.payload as { projectId?: number }).projectId);
  if (!projectId) throw new Error("BAD_PAYLOAD");

  await startJob(job.id);
  await progressJob(job.id, { step: "loading_project" });

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project) throw new Error("PROJECT_NOT_FOUND");
  const [versionRow] = await db
    .select()
    .from(bookTemplateVersions)
    .where(eq(bookTemplateVersions.id, project.templateVersionId))
    .limit(1);
  if (!versionRow) throw new Error("TEMPLATE_VERSION_NOT_FOUND");

  await progressJob(job.id, { step: "generating" });
  const provider = getTextProvider();
  const result = await provider.generateNarrative({
    schema: parseJson(versionRow.narrativeSchema, null),
    personalization: toProviderInput(
      parseJson<Personalization>(project.personalization, {
        hero_name: "Héros·ïne",
        age_band: "6-8",
        companion: true,
        moral_emphasis: "ecoute",
      }),
    ),
    projectId,
  });

  await progressJob(job.id, { step: "storing" });
  const [maxRow] = await db
    .select({ v: storyVersions.version })
    .from(storyVersions)
    .where(eq(storyVersions.projectId, projectId))
    .orderBy(desc(storyVersions.version))
    .limit(1);
  const nextVersion = (maxRow?.v ?? 0) + 1;

  await db.insert(storyVersions).values({
    projectId,
    version: nextVersion,
    source: provider.name === "demo-text" ? "deterministic" : "ai",
    provider: provider.name,
    promptVersion: result.promptVersion ?? null,
    content: { pages: result.pages },
    status: "ready",
    createdByUser: false,
  });

  await db
    .update(projects)
    .set({ status: "narrative_ready", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  await recordCost({
    userId: project.userId,
    projectId,
    jobId: job.id,
    provider: provider.name,
    kind: "text",
    units: 1,
    unitCostCents: 0,
  });

  await completeJob(job.id, { step: "done", storyVersion: nextVersion });
}

export async function listStoryVersions(projectId: number) {
  const db = getDb();
  const rows = await db
    .select()
    .from(storyVersions)
    .where(eq(storyVersions.projectId, projectId))
    .orderBy(desc(storyVersions.version));
  return rows.map((r) => ({
    ...r,
    content: parseJson(r.content, { pages: [] }),
  }));
}

export async function getStoryVersion(projectId: number, versionId: number) {
  const db = getDb();
  const [row] = await db
    .select()
    .from(storyVersions)
    .where(eq(storyVersions.id, versionId))
    .limit(1);
  return row && row.projectId === projectId ? row : null;
}

export async function approveStoryVersion(projectId: number, versionId: number) {
  const db = getDb();
  const version = await getStoryVersion(projectId, versionId);
  if (!version) return false;

  await db
    .update(storyVersions)
    .set({ status: "superseded" })
    .where(eq(storyVersions.projectId, projectId));
  await db
    .update(storyVersions)
    .set({ status: "approved", createdByUser: true })
    .where(eq(storyVersions.id, versionId));
  await db
    .update(projects)
    .set({ approvedStoryVersionId: versionId, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  return true;
}

