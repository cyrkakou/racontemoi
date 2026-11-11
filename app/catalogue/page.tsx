import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
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
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:px-6">
      <header className="max-w-2xl">
        <div className="rule-ornament max-w-xs">
          <p className="eyebrow text-terra-deep">Le catalogue</p>
        </div>
        <h1 className="mt-6 font-display text-5xl font-semibold leading-[1.05] tracking-tight text-ink sm:text-6xl">
          {fr.catalog.title}
          <em className="block font-medium italic text-ink-soft">à créer.</em>
        </h1>
        <p className="story-text mt-6 text-lg leading-relaxed text-ink-soft">
          {fr.catalog.subtitle}
        </p>
      </header>

      {templates.length === 0 ? (
        <div className="mt-20 rounded-sm border border-dashed border-line bg-paper-deep/50 p-16 text-center">
          <p className="font-display text-2xl text-ink">La bibliothèque ouvre bientôt.</p>
          <p className="mt-3 text-sm text-ink-soft">
            Le premier livre, « Le Baobab aux Mille Secrets », est en préparation.
          </p>
        </div>
      ) : (
        <ul className="mt-16 grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((t, i) => (
            <li key={t.id} className="group">
              <Link href={`/histoires/${t.slug}`} className="block cursor-pointer">
                <BookCover
                  seed={t.id * 7919}
                  title={t.title}
                  subtitle={collectionName.get(t.collectionId) ?? undefined}
                  className="transition-transform duration-500 ease-out group-hover:-translate-y-2 group-hover:rotate-0"
                />
                <div className="mt-5 flex items-start justify-between gap-3">
                  <div>
                    <p className="eyebrow text-ink-faint">N° {String(i + 1).padStart(2, "0")}</p>
                    <h2 className="mt-1 font-display text-[1.35rem] font-semibold leading-snug text-ink transition-colors duration-300 group-hover:text-terra-deep">
                      {t.title}
                    </h2>
                    <p className="story-text mt-2 line-clamp-3 text-[0.95rem] text-ink-soft">
                      {t.synopsisFr}
                    </p>
                  </div>
                </div>
                <span className="link-sweep mt-4 inline-flex items-center gap-2 pb-0.5 text-sm font-medium text-terra-deep">
                  {fr.catalog.startBook}
                  <ArrowRight
                    className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1"
                    aria-hidden
                  />
                </span>
              </Link>
            </li>
          ))}

          {/* "Bientôt" placeholders */}
          {[1, 2, 3].map((i) => (
            <li
              key={`soon-${i}`}
              className="flex aspect-[3/4] flex-col items-center justify-center rounded-md border border-dashed border-line bg-paper-deep/40 p-8 text-center"
              aria-hidden
            >
              <p className="font-display text-xl italic text-ink-faint">{fr.catalog.soon}</p>
              <p className="eyebrow mt-2 text-ink-faint/70">À l’atelier</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
