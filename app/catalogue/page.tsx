import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { fr } from "@/lib/i18n/fr";
import { getDb } from "@/lib/db";
import { bookTemplates, editorialCollections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const metadata: Metadata = { title: fr.catalog.title };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function CatalogPage() {
  const db = getDb();
  const collections = await db
    .select()
    .from(editorialCollections)
    .where(eq(editorialCollections.status, "published"))
    .orderBy(editorialCollections.sortOrder);
  const templates = await db
    .select()
    .from(bookTemplates)
    .where(eq(bookTemplates.editorialStatus, "published"));

  const collectionName = new Map(collections.map((c) => [c.id, c.titleFr]));

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header className="max-w-2xl">
        <h1 className="font-display text-4xl font-semibold text-ink sm:text-5xl">
          {fr.catalog.title}
        </h1>
        <p className="story-text mt-4 text-lg text-ink-soft">{fr.catalog.subtitle}</p>
      </header>

      {templates.length === 0 ? (
        <div className="mt-16 rounded-2xl border border-dashed border-line bg-paper-deep/50 p-12 text-center">
          <p className="font-display text-xl text-ink">La bibliothèque ouvre bientôt.</p>
          <p className="mt-2 text-sm text-ink-soft">
            Le premier livre, « Le Baobab aux Mille Secrets », est en préparation.
          </p>
        </div>
      ) : (
        <ul className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t) => (
            <li key={t.id} className="group">
              <Link href={`/histoires/${t.slug}`} className="block">
                <BookCover
                  seed={t.id * 7919}
                  title={t.title}
                  subtitle={collectionName.get(t.collectionId) ?? undefined}
                  className="transition-transform duration-500 group-hover:-translate-y-1.5 group-hover:rotate-0"
                />
                <div className="mt-4 flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold text-ink group-hover:text-terra-deep transition-colors">
                      {t.title}
                    </h2>
                    <p className="mt-1 line-clamp-2 text-sm text-ink-soft">{t.synopsisFr}</p>
                  </div>
                  <span className="mt-1 inline-flex shrink-0 items-center gap-1 rounded-full bg-botanical/10 px-3 py-1 text-xs font-medium text-botanical">
                    <Clock className="h-3 w-3" aria-hidden />
                    {fr.story.pages}
                  </span>
                </div>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-terra">
                  {fr.catalog.startBook}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            </li>
          ))}

          {/* "Bientôt" placeholders */}
          {[1, 2, 3].map((i) => (
            <li
              key={`soon-${i}`}
              className="rounded-md border border-dashed border-line bg-paper-deep/40 p-8 text-center"
              aria-hidden
            >
              <p className="font-display text-lg text-ink-soft/60">{fr.catalog.soon}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
