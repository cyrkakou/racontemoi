import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  exportJobs,
  illustrationAssets,
  projects,
  storyVersions,
} from "@/lib/db/schema";
import { buildBookPdf, type PdfPageInput } from "@/lib/pdf";
import type { IllustrationInput } from "@/lib/ai/types";
import { completeJob, enqueueJob, progressJob, startJob, type JobRow } from "./jobs";
import { recordCost } from "./budget";
import { getProjectCharacters, getProjectPages } from "./projects";
import { parseJson } from "@/lib/utils";

export async function requestExport(projectId: number) {
  return enqueueJob({
    type: "pdf_export",
    projectId,
    payload: { projectId },
    priority: 80,
  });
}

export async function handlePdfExportJob(job: JobRow): Promise<void> {
  const db = getDb();
  const projectId = Number((job.payload as { projectId?: number }).projectId);
  if (!projectId) throw new Error("BAD_PAYLOAD");

  await startJob(job.id);
  await progressJob(job.id, { step: "loading" });

  const [project] = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
  if (!project?.approvedStoryVersionId) throw new Error("NO_APPROVED_STORY");

  const [story] = await db
    .select()
    .from(storyVersions)
    .where(eq(storyVersions.id, project.approvedStoryVersionId))
    .limit(1);
  if (!story) throw new Error("STORY_NOT_FOUND");

  const pages = await getProjectPages(projectId);
  const characters = await getProjectCharacters(projectId);
  const hero = characters.find((c) => c.role === "hero");
  const companion = characters.find((c) => c.role === "companion");
  const content = parseJson<{ pages: { no: number; kind: string; title?: string; textFr: string | null; illustrationHint: string }[] }>(story.content, { pages: [] });

  // For each page, rebuild the IllustrationInput that generated its approved asset
  const pdfInputs: PdfPageInput[] = [];
  for (const page of pages) {
    const pageContent = content.pages.find((p) => p.no === page.pageNo);
    let illustration: IllustrationInput | null = null;

    if (page.approvedAssetId && hero) {
      const [asset] = await db
        .select()
        .from(illustrationAssets)
        .where(eq(illustrationAssets.id, page.approvedAssetId))
        .limit(1);
      if (asset?.prompt) {
        const stored = parseJson<{ input?: IllustrationInput }>(asset.prompt, {});
        illustration = stored.input ?? null;
      }
      if (!illustration) {
        const seed = (projectId * 1000 + page.pageNo * 37 + (project.characterVersion ?? 1) * 11) >>> 0;
        illustration = {
          pageNo: page.pageNo,
          pageKind: page.kind,
          sceneText: pageContent?.textFr ?? pageContent?.title ?? `Page ${page.pageNo}`,
          characterBible: {
            name: hero.name,
            description: hero.description,
            styleTokens: parseJson<Record<string, unknown>>(hero.styleTokens, {}),
            bibleVersion: hero.bibleVersion,
          },
          companionBible: companion
            ? { name: companion.name, description: companion.description, styleTokens: parseJson<Record<string, unknown>>(companion.styleTokens, {}) }
            : null,
          stylePrefix: "",
          seed,
          aspect: "3:4",
        };
      }
    }

    pdfInputs.push({
      pageNo: page.pageNo,
      kind: page.kind as PdfPageInput["kind"],
      title: pageContent?.title,
      textFr: page.textOverride ?? pageContent?.textFr ?? null,
      illustration,
    });
    await progressJob(job.id, { step: "composing", pageNo: page.pageNo });
  }

  await progressJob(job.id, { step: "rendering_pdf" });
  const pdfBytes = await buildBookPdf(pdfInputs);

  const { putFile } = await import("@/lib/storage");
  const stored = await putFile({
    data: Buffer.from(pdfBytes),
    mime: "application/pdf",
    kind: "pdf",
    ownerUserId: project.userId,
    projectId,
  });

  await db.insert(exportJobs).values({
    projectId,
    storyVersionId: project.approvedStoryVersionId,
    status: "ready",
    fileId: stored.id,
    pagesRendered: pdfInputs.length,
  });

  await db
    .update(projects)
    .set({ status: "exported", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  await recordCost({
    userId: project.userId,
    projectId,
    jobId: job.id,
    provider: "pdf-lib",
    kind: "pdf",
    units: 1,
    unitCostCents: 0,
  });

  await completeJob(job.id, { step: "done", pages: pdfInputs.length, fileId: stored.id });
}

export async function listExports(projectId: number) {
  const db = getDb();
  return db.select().from(exportJobs).where(eq(exportJobs.projectId, projectId));
}
