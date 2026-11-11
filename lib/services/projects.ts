import { and, desc, eq, isNull } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "@/lib/db";
import {
  bookPages,
  bookTemplateVersions,
  bookTemplates,
  personalizationSchemas,
  projectCharacters,
  projects,
} from "@/lib/db/schema";
import { deleteProjectFiles } from "@/lib/storage";
import { companionBible, heroBibleTemplate } from "@/lib/content/pilot";
import type { PersonalizationInput } from "@/lib/ai/types";
import { parseJson } from "@/lib/utils";

export const personalizationSchema = z.object({
  hero_name: z.string().trim().min(1).max(30).regex(/^[A-Za-zÀ-ÖØ-öø-ÿ' -]+$/u, "prénom invalide"),
  age_band: z.enum(["3-5", "6-8", "9-12"]),
  skin_tone: z.string().max(30).optional(),
  hair: z.string().max(60).optional(),
  outfit: z.string().max(40).optional(),
  companion: z.boolean().optional().default(true),
  moral_emphasis: z.enum(["ecoute", "partage", "courage"]).optional().default("ecoute"),
});
export type Personalization = z.infer<typeof personalizationSchema>;

export function toProviderInput(p: Personalization): PersonalizationInput {
  return {
    heroName: p.hero_name,
    ageBand: p.age_band,
    traits: {
      skinTone: p.skin_tone,
      hair: p.hair,
      outfit: p.outfit,
    },
    companion: p.companion,
    moralEmphasis: p.moral_emphasis,
  };
}

function fillTemplate(tpl: string, p: Personalization): string {
  return tpl
    .replaceAll("{{hero}}", p.hero_name)
    .replaceAll("{{skin_tone}}", p.skin_tone ?? "mat")
    .replaceAll("{{hair}}", p.hair ?? "bruns")
    .replaceAll("{{outfit}}", p.outfit ?? "pagne wax");
}

export async function createProject(
  userId: number,
  templateSlug: string,
  rawPersonalization: unknown,
) {
  const personalization = personalizationSchema.parse(rawPersonalization);
  const db = getDb();

  const [template] = await db
    .select()
    .from(bookTemplates)
    .where(and(eq(bookTemplates.slug, templateSlug), eq(bookTemplates.editorialStatus, "published")))
    .limit(1);
  if (!template?.currentVersionId) throw new Error("TEMPLATE_NOT_FOUND");

  const [version] = await db
    .select()
    .from(bookTemplateVersions)
    .where(eq(bookTemplateVersions.id, template.currentVersionId))
    .limit(1);
  if (!version) throw new Error("TEMPLATE_VERSION_NOT_FOUND");

  const pagePlan = parseJson<{ pages?: { no: number; kind: string }[] }>(
    version.pagePlan,
    {},
  );
  const pages = pagePlan?.pages ?? [];
  if (pages.length === 0) throw new Error("PAGE_PLAN_EMPTY");

  const [project] = await db
    .insert(projects)
    .values({
      userId,
      templateId: template.id,
      templateVersionId: version.id,
      title: `${template.title} — ${personalization.hero_name}`,
      personalization,
      status: "draft",
    })
    .$returningId();
  const projectId = project.id;

  // Character bible rows
  const heroDesc = fillTemplate(heroBibleTemplate.description, personalization);
  const [hero] = await db
    .insert(projectCharacters)
    .values({
      projectId,
      role: "hero",
      name: personalization.hero_name,
      ageBand: personalization.age_band,
      description: heroDesc,
      styleTokens: heroBibleTemplate.styleTokens,
      bibleVersion: 1,
    })
    .$returningId();

  if (personalization.companion) {
    await db.insert(projectCharacters).values({
      projectId,
      role: "companion",
      name: companionBible.name,
      description: companionBible.description,
      styleTokens: companionBible.styleTokens,
      bibleVersion: 1,
    });
  }

  // Book pages
  const pageValues = pages.map((p) => ({
    projectId,
    pageNo: p.no,
    kind: p.kind as "cover" | "story" | "illustration_only" | "back",
  }));
  await db.insert(bookPages).values(pageValues);

  return { projectId, heroCharacterId: hero.id };
}

export async function getProjectForUser(userId: number, projectId: number) {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, userId),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);
  return project ?? null;
}

export async function listUserProjects(userId: number) {
  const db = getDb();
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.userId, userId), isNull(projects.deletedAt)))
    .orderBy(desc(projects.updatedAt));
}

export async function getProjectPages(projectId: number) {
  const db = getDb();
  return db
    .select()
    .from(bookPages)
    .where(eq(bookPages.projectId, projectId))
    .orderBy(bookPages.pageNo);
}

export async function getProjectCharacters(projectId: number) {
  const db = getDb();
  return db
    .select()
    .from(projectCharacters)
    .where(eq(projectCharacters.projectId, projectId));
}

export async function softDeleteProject(userId: number, projectId: number) {
  const project = await getProjectForUser(userId, projectId);
  if (!project) return false;
  const db = getDb();
  await db
    .update(projects)
    .set({ status: "deleted", deletedAt: new Date() })
    .where(eq(projects.id, projectId));
  await deleteProjectFiles(projectId);
  return true;
}

export { personalizationSchemas };
