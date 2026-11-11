import Link from "next/link";
import { ArrowRight, Feather, PenLine, BookOpen, Heart } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { fr } from "@/lib/i18n/fr";
import { getDb } from "@/lib/db";
import { bookTemplates, editorialCollections } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getCatalog() {
  try {
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
    return { collections, templates };
  } catch {
    return { collections: [], templates: [] };
  }
}

const STEPS = [
  { icon: BookOpen, title: fr.home.how1Title, text: fr.home.how1Text },
  { icon: PenLine, title: fr.home.how2Title, text: fr.home.how2Text },
  { icon: Feather, title: fr.home.how3Title, text: fr.home.how3Text },
  { icon: Heart, title: fr.home.how4Title, text: fr.home.how4Text },
];

export default async function Home() {
  const { collections, templates } = await getCatalog();
  const pilot = templates.find((t) => t.slug === "le-baobab-aux-mille-secrets");

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 right-[-10%] h-[480px] w-[480px] rounded-full opacity-30 blur-3xl"
          style={{ background: "radial-gradient(circle, #c08a2d55, transparent 70%)" }}
        />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:pt-24">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-line bg-paper-deep/60 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.14em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-terra" />
              {fr.home.eyebrow}
            </p>
            <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-ink sm:text-5xl lg:text-6xl">
              {fr.home.heroTitle}
            </h1>
            <p className="story-text mt-6 text-lg text-ink-soft">{fr.home.heroSub}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={pilot ? `/histoires/${pilot.slug}` : "/catalogue"}
                className="inline-flex items-center gap-2 rounded-full bg-terra px-6 py-3 text-base font-medium text-paper shadow-paper transition-colors hover:bg-terra-deep"
              >
                {fr.home.ctaPrimary}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              <Link
                href="/catalogue"
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-6 py-3 text-base font-medium text-ink transition-colors hover:border-ink-soft/40"
              >
                {fr.home.ctaSecondary}
              </Link>
            </div>
          </div>

          {pilot ? (
            <div className="mx-auto w-full max-w-sm lg:max-w-none">
              <BookCover
                seed={pilot.id * 7919}
                title={pilot.title}
                subtitle="Le livre pilote"
                className="mx-auto max-w-[320px] rotate-2 transition-transform duration-500 hover:rotate-0"
              />
            </div>
          ) : null}
        </div>
      </section>

      {/* Collections */}
      {collections.length > 0 ? (
        <section className="border-t border-line/70 bg-paper-deep/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="font-display text-3xl font-semibold text-ink">
              {fr.home.collectionsTitle}
            </h2>
            <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {collections.map((c) => (
                <li
                  key={c.id}
                  className="rounded-xl border border-line bg-paper p-5 shadow-paper"
                >
                  <p className="font-display text-lg font-semibold text-ink">{c.titleFr}</p>
                  <p className="mt-2 text-sm leading-relaxed text-ink-soft">{c.descriptionFr}</p>
                  {c.culturalScope ? (
                    <p className="mt-3 text-xs uppercase tracking-wide text-ink-soft/70">
                      {c.culturalScope}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl text-sm text-ink-soft">{fr.home.culturalNote}</p>
          </div>
        </section>
      ) : null}

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-ink">{fr.home.howTitle}</h2>
        <ol className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-line bg-paper p-6 shadow-paper">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-ochre/15 text-ochre">
                  <s.icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                </span>
                <span className="font-display text-sm text-ink-soft/70">{String(i + 1).padStart(2, "0")}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Final CTA */}
      <section className="border-t border-line/70 bg-ink text-paper">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-16 text-center sm:px-6">
          <h2 className="font-display max-w-2xl text-3xl font-semibold sm:text-4xl">
            Le premier conte ne demande que quelques minutes.
          </h2>
          <Link
            href="/catalogue"
            className="inline-flex items-center gap-2 rounded-full bg-paper px-7 py-3.5 font-medium text-ink transition-colors hover:bg-clay"
          >
            {fr.home.ctaSecondary}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
