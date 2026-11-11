import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpen, Globe2 } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { PersonalizeForm } from "@/components/personalize-form";
import { fr } from "@/lib/i18n/fr";
import { getDb } from "@/lib/db";
import {
  bookTemplates,
  bookTemplateVersions,
  culturalContexts,
  editorialCollections,
  personalizationSchemas,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { getSessionUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const db = getDb();
  const [t] = await db.select().from(bookTemplates).where(eq(bookTemplates.slug, slug)).limit(1);
  return { title: t?.title ?? fr.catalog.title };
}

interface SchemaField {
  key: string;
  type: "text" | "enum" | "boolean";
  required?: boolean;
  options?: string[];
  maxLength?: number;
  default?: string | boolean;
}

export default async function StoryPage({ params }: Props) {
  const { slug } = await params;
  const db = getDb();
  const user = await getSessionUser();

  const [template] = await db
    .select()
    .from(bookTemplates)
    .where(eq(bookTemplates.slug, slug))
    .limit(1);
  if (!template || template.editorialStatus !== "published" || !template.currentVersionId) {
    notFound();
  }

  const [version] = await db
    .select()
    .from(bookTemplateVersions)
    .where(eq(bookTemplateVersions.id, template.currentVersionId))
    .limit(1);
  const [collection] = await db
    .select()
    .from(editorialCollections)
    .where(eq(editorialCollections.id, template.collectionId))
    .limit(1);
  const [context] = await db
    .select()
    .from(culturalContexts)
    .where(eq(culturalContexts.id, template.culturalContextId))
    .limit(1);
  const [pschema] = await db
    .select()
    .from(personalizationSchemas)
    .where(eq(personalizationSchemas.templateVersionId, template.currentVersionId))
    .limit(1);

  const schemaJson = (pschema?.definition ?? { fields: [] }) as { fields?: SchemaField[] };
  const fields = schemaJson.fields ?? [];

  const plan = (version?.pagePlan ?? {}) as { pages?: { kind: string }[] };
  const storyPages = plan.pages?.filter((p) => p.kind === "story").length ?? 10;

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/catalogue"
        className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink transition-colors"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {fr.catalog.backToCatalog}
      </Link>

      <div className="mt-8 grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
        {/* Left: cover + meta */}
        <div>
          <BookCover
            seed={template.id * 7919}
            title={template.title}
            subtitle={collection?.titleFr}
            className="mx-auto max-w-[300px] lg:max-w-sm"
          />
          <dl className="mt-8 space-y-4 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-ink-soft">{fr.story.pages}</dt>
              <dd className="text-ink">{storyPages + 2} pages illustrées</dd>
            </div>
            {collection ? (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-ink-soft">Collection</dt>
                <dd className="text-ink">{collection.titleFr}</dd>
              </div>
            ) : null}
            {context ? (
              <div className="flex gap-3">
                <dt className="w-28 shrink-0 text-ink-soft">{fr.story.culturalContext}</dt>
                <dd className="text-ink">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-ochre/15 px-3 py-1 text-xs font-medium text-ochre">
                    <Globe2 className="h-3.5 w-3.5" aria-hidden />
                    {context.traditionType === "inspiration"
                      ? fr.story.inspirationNote
                      : context.traditionType === "history"
                        ? "Contexte historique attesté"
                        : "Fiction originale"}
                  </span>
                  <p className="story-text mt-3 text-ink-soft">{context.summaryFr}</p>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* Right: synopsis + personalization */}
        <div>
          <h1 className="font-display text-4xl font-semibold text-ink">{template.title}</h1>
          <p className="story-text mt-4 text-lg text-ink-soft">{template.synopsisFr}</p>

          <section className="mt-10 rounded-2xl border border-line bg-paper-deep/50 p-6 sm:p-8 shadow-paper">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {fr.story.whatYouPersonalize}
            </h2>
            <div className="mt-6">
              <PersonalizeForm
                templateSlug={template.slug}
                fields={fields}
                redirectBase={`/histoires/${template.slug}`}
              />
            </div>
            {!user ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-ink-soft">
                <BookOpen className="h-4 w-4" aria-hidden />
                Un compte est nécessaire pour sauvegarder votre livre.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </main>
  );
}
