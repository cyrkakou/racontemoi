import { and, eq, inArray, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  bookPages,
  illustrationAssets,
  projects,
  storyVersions,
} from "@/lib/db/schema";
import { getImageProvider } from "@/lib/ai";
import type { IllustrationInput } from "@/lib/ai/types";
import { putFile } from "@/lib/storage";
import { completeJob, enqueueJob, progressJob, startJob, type JobRow } from "./jobs";
import { recordCost } from "./budget";
import { getProjectCharacters, getProjectPages } from "./projects";
import { parseJson } from "@/lib/utils";

const STYLE_PREFIX =
  "Hand-painted watercolor storybook plate, warm late-afternoon savanna light, " +
  "paper grain texture, editorial composition with generous negative space, " +
  "no text, no letters, no watermark.";

export async function requestIllustrationBatch(projectId: number) {
  return enqueueJob({
    type: "illustration_batch",
    projectId,
    payload: { projectId },
    priority: 60,
  });
}

export async function requestPageIllustration(projectId: number, pageNo: number, regenerate = false) {
  return enqueueJob({
    type: "page_illustration",
    projectId,
    payload: { projectId, pageNo, regenerate },
    priority: 70,
  });
}

/** Batch orchestrator: fans out one job per book page. */
export async function handleIllustrationBatchJob(job: JobRow): Promise<void> {
  const projectId = Number((job.payload as { projectId?: number }).projectId);
  if (!projectId) throw new Error("BAD_PAYLOAD");
  await startJob(job.id);

  const pages = await getProjectPages(projectId);
  const storyPages = pages.filter((p) => p.kind === "story" || p.kind === "cover" || p.kind === "back");

  let enqueued = 0;
  for (const page of storyPages) {
    const { created } = await requestPageIllustration(projectId, page.pageNo);
    if (created) enqueued++;
  }

  const db = getDb();
  await db
    .update(projects)
    .set({ status: "illustrating", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  await completeJob(job.id, { step: "fanned_out", pages: storyPages.length, enqueued });
}

interface PageContent {
  no: number;
  kind: string;
  title?: string;
  textFr: string | null;
  illustrationHint: string;
}

export async function handlePageIllustrationJob(job: JobRow): Promise<void> {
  const db = getDb();
  const { projectId, pageNo } = job.payload as { projectId?: number; pageNo?: number };
  if (!projectId || !pageNo) throw new Error("BAD_PAYLOAD");

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

  const content = parseJson<{ pages: PageContent[] }>(story.content, { pages: [] });
  const pageContent = content.pages.find((p) => p.no === pageNo);
  const [page] = await db
    .select()
    .from(bookPages)
    .where(and(eq(bookPages.projectId, projectId), eq(bookPages.pageNo, pageNo)))
    .limit(1);
  if (!page) throw new Error("PAGE_NOT_FOUND");

  const characters = await getProjectCharacters(projectId);
  const hero = characters.find((c) => c.role === "hero");
  const companion = characters.find((c) => c.role === "companion");
  if (!hero) throw new Error("NO_HERO_BIBLE");

  // New asset row first (idempotent-ish: regenerate creates a new asset)
  const assetId = crypto.randomUUID();
  const seed =
    (projectId * 1000 + pageNo * 37 + (project.characterVersion ?? 1) * 11) >>> 0;

  const input: IllustrationInput = {
    pageNo,
    pageKind: page.kind,
    sceneText: pageContent?.textFr ?? pageContent?.title ?? `Page ${pageNo}`,
    characterBible: {
      name: hero.name,
      description: hero.description,
      styleTokens: parseJson<Record<string, unknown>>(hero.styleTokens, {}),
      bibleVersion: hero.bibleVersion,
    },
    companionBible: companion
      ? {
          name: companion.name,
          description: companion.description,
          styleTokens: parseJson<Record<string, unknown>>(companion.styleTokens, {}),
        }
      : null,
    stylePrefix: STYLE_PREFIX,
    seed,
    aspect: "3:4",
  };

  await progressJob(job.id, { step: "generating", pageNo });
  const provider = getImageProvider();
  const result = await provider.generateScene(input);

  await progressJob(job.id, { step: "storing", pageNo });
  const stored = await putFile({
    data: result.svg,
    mime: result.mime,
    kind: page.kind === "cover" ? "cover" : "illustration",
    ownerUserId: project.userId,
    projectId,
  });

  await db.insert(illustrationAssets).values({
    id: assetId,
    projectId,
    pageId: page.id,
    characterVersion: project.characterVersion,
    prompt: { input, stylePrefix: STYLE_PREFIX, promptVersion: result.promptVersion },
    provider: provider.name,
    status: "ready",
    fileId: stored.id,
    costCents: 0,
    seed,
  });

  await db
    .update(bookPages)
    .set({ currentAssetId: assetId, updatedAt: new Date() })
    .where(eq(bookPages.id, page.id));

  await recordCost({
    userId: project.userId,
    projectId,
    jobId: job.id,
    provider: provider.name,
    kind: "image",
    units: 1,
    unitCostCents: 0,
    metadata: { pageNo },
  });

  await completeJob(job.id, { step: "done", pageNo, assetId });
}

export async function approvePageAsset(projectId: number, pageNo: number, assetId: string) {
  const db = getDb();
  const [page] = await db
    .select()
    .from(bookPages)
    .where(and(eq(bookPages.projectId, projectId), eq(bookPages.pageNo, pageNo)))
    .limit(1);
  if (!page) return false;

  const [asset] = await db
    .select()
    .from(illustrationAssets)
    .where(and(eq(illustrationAssets.id, assetId), eq(illustrationAssets.projectId, projectId)))
    .limit(1);
  if (!asset || asset.pageId !== page.id) return false;

  await db
    .update(illustrationAssets)
    .set({ status: "superseded" })
    .where(and(eq(illustrationAssets.pageId, page.id), eq(illustrationAssets.status, "approved")));
  await db
    .update(illustrationAssets)
    .set({ status: "approved" })
    .where(eq(illustrationAssets.id, assetId));
  await db
    .update(bookPages)
    .set({ approvedAssetId: assetId, updatedAt: new Date() })
    .where(eq(bookPages.id, page.id));

  // Project is "ready" when every page has an approved asset
  // (don't downgrade an already-exported project)
  const pages = await getProjectPages(projectId);
  const allApproved = pages.every((p) => p.approvedAssetId);
  if (allApproved) {
    await db
      .update(projects)
      .set({
        status: sql`CASE WHEN ${projects.status} = 'exported' THEN 'exported' ELSE 'ready' END`,
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));
  }
  return true;
}

export async function listPageAssets(projectId: number) {
  const db = getDb();
  return db
    .select()
    .from(illustrationAssets)
    .where(eq(illustrationAssets.projectId, projectId))
    .orderBy(illustrationAssets.createdAt);
}

export async function getAssetFileIds(ids: string[]) {
  if (ids.length === 0) return new Map<string, string>();
  const db = getDb();
  const rows = await db
    .select({ id: illustrationAssets.id, fileId: illustrationAssets.fileId })
    .from(illustrationAssets)
    .where(inArray(illustrationAssets.id, ids));
  return new Map(rows.filter((r) => r.fileId).map((r) => [r.id, r.fileId as string]));
}
