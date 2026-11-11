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
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6">
      <Link
        href="/catalogue"
        className="link-sweep inline-flex items-center gap-2 pb-1 text-sm font-medium text-ink-soft hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {fr.catalog.backToCatalog}
      </Link>

      <div className="mt-10 grid gap-14 lg:grid-cols-[0.8fr_1.2fr]">
        {/* Left: cover + spec sheet */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <BookCover
            seed={template.id * 7919}
            title={template.title}
            subtitle={collection?.titleFr}
            className="mx-auto max-w-[290px] lg:max-w-[340px]"
          />
          <dl className="mt-10 divide-y divide-line border-y border-line">
            {collection ? (
              <div className="flex items-baseline justify-between gap-4 py-3.5">
                <dt className="eyebrow text-ink-faint">Collection</dt>
                <dd className="font-display text-base font-semibold text-ink">{collection.titleFr}</dd>
              </div>
            ) : null}
            <div className="flex items-baseline justify-between gap-4 py-3.5">
              <dt className="eyebrow text-ink-faint">{fr.story.pages}</dt>
              <dd className="font-display text-base font-semibold text-ink">{storyPages + 2} pages illustrées</dd>
            </div>
            {context ? (
              <div className="py-4">
                <dt className="eyebrow flex items-center gap-2 text-ink-faint">
                  <Globe2 className="h-3.5 w-3.5" aria-hidden />
                  {fr.story.culturalContext}
                </dt>
                <dd className="mt-3">
                  <span className="inline-flex items-center rounded-full border border-ochre/40 bg-ochre/10 px-3 py-1 text-xs font-medium text-ochre">
                    {context.traditionType === "inspiration"
                      ? fr.story.inspirationNote
                      : context.traditionType === "history"
                        ? "Contexte historique attesté"
                        : "Fiction originale"}
                  </span>
                  <p className="story-text mt-4 text-[0.95rem] leading-relaxed text-ink-soft">
                    {context.summaryFr}
                  </p>
                </dd>
              </div>
            ) : null}
          </dl>
        </div>

        {/* Right: title + synopsis + personalization */}
        <div>
          <div className="rule-ornament max-w-xs">
            <p className="eyebrow text-terra-deep">{fr.story.synopsis}</p>
          </div>
          <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl">
            {template.title}
          </h1>
          <p className="story-text mt-6 text-xl leading-relaxed text-ink-soft">
            {template.synopsisFr}
          </p>

          <section className="mt-14 border-t-2 border-ink/80 pt-10">
            <h2 className="font-display text-2xl font-semibold text-ink">
              {fr.story.whatYouPersonalize}
            </h2>
            <div className="mt-8">
              <PersonalizeForm
                templateSlug={template.slug}
                fields={fields}
                redirectBase={`/histoires/${template.slug}`}
              />
            </div>
            {!user ? (
              <p className="mt-6 flex items-center gap-2 text-sm text-ink-soft">
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
