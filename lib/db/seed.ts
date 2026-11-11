import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import {
  bookTemplateVersions,
  bookTemplates,
  culturalContexts,
  editorialCollections,
  personalizationSchemas,
} from "@/lib/db/schema";
import {
  PILOT_SLUG,
  pilotNarrativeSchema,
  pilotPagePlan,
  pilotPersonalizationSchema,
} from "@/lib/content/pilot";

const COLLECTIONS = [
  { slug: "contes-legendes", title: "Contes & Légendes", sort: 1, desc: "Histoires orales, pourquoi du monde, tricksters, morale du partage.", scope: "Afrique de l'Ouest et du Centre — traditions orales" },
  { slug: "royaumes-civilisations", title: "Royaumes & Civilisations", sort: 2, desc: "Empires, cités, savoirs — pour les 8–12 ans en priorité.", scope: "Afrique continentale" },
  { slug: "famille-transmission", title: "Famille & Transmission", sort: 3, desc: "Grands-parents, langue, rituels, mémoire familiale.", scope: "Diaspora et familles" },
  { slug: "afrofuturisme", title: "Afrofuturisme & Imagination", sort: 4, desc: "Innovation, science-fiction africaine, espoir.", scope: "Projection contemporaine" },
];

/** Idempotent editorial seed — inserts collections + pilot book. */
export async function seedEditorial(): Promise<{ seeded: string[] }> {
  const db = getDb();
  const seeded: string[] = [];

  for (const c of COLLECTIONS) {
    const [existing] = await db
      .select({ id: editorialCollections.id })
      .from(editorialCollections)
      .where(eq(editorialCollections.slug, c.slug))
      .limit(1);
    if (!existing) {
      await db.insert(editorialCollections).values({
        slug: c.slug,
        titleFr: c.title,
        descriptionFr: c.desc,
        culturalScope: c.scope,
        sortOrder: c.sort,
        status: "published",
      });
      seeded.push(`collection:${c.slug}`);
    }
  }

  const [collection] = await db
    .select()
    .from(editorialCollections)
    .where(eq(editorialCollections.slug, "contes-legendes"))
    .limit(1);

  const [context] = await db
    .select()
    .from(culturalContexts)
    .where(eq(culturalContexts.region, "savanes-ouest-africaines"))
    .limit(1);
  let contextId = context?.id;
  if (!contextId) {
    const [cc] = await db
      .insert(culturalContexts)
      .values({
        region: "savanes-ouest-africaines",
        traditionType: "inspiration",
        summaryFr:
          "Le baobab, arbre millénaire de la savane, est au cœur de nombreux récits oraux ouest-africains. Ce livre s'en inspire sans reproduire un conte traditionnel attesté : c'est une fiction originale.",
        sources: ["tradition orale sahélienne (inspiration, non attestée)"],
      })
      .$returningId();
    contextId = cc.id;
    seeded.push("cultural_context:baobab");
  }

  const [template] = await db
    .select()
    .from(bookTemplates)
    .where(eq(bookTemplates.slug, PILOT_SLUG))
    .limit(1);

  if (!template) {
    const [t] = await db
      .insert(bookTemplates)
      .values({
        slug: PILOT_SLUG,
        collectionId: collection.id,
        title: "Le Baobab aux Mille Secrets",
        synopsisFr:
          "Un enfant traverse la savane à la recherche de l'arbre qui garde les secrets du vent — et découvre que le plus grand secret était de savoir écouter.",
        culturalContextId: contextId,
        editorialStatus: "published",
      })
      .$returningId();

    const [v] = await db
      .insert(bookTemplateVersions)
      .values({
        templateId: t.id,
        version: 1,
        narrativeSchema: pilotNarrativeSchema,
        pagePlan: { pages: pilotPagePlan },
        status: "published",
        publishedAt: new Date(),
      })
      .$returningId();

    await db
      .update(bookTemplates)
      .set({ currentVersionId: v.id })
      .where(eq(bookTemplates.id, t.id));

    await db.insert(personalizationSchemas).values({
      templateVersionId: v.id,
      version: 1,
      definition: pilotPersonalizationSchema,
    });

    seeded.push(`template:${PILOT_SLUG}`);
  }

  return { seeded };
}
