import Link from "next/link";
import { ArrowRight, ArrowDown } from "lucide-react";
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
  { title: fr.home.how1Title, text: fr.home.how1Text },
  { title: fr.home.how2Title, text: fr.home.how2Text },
  { title: fr.home.how3Title, text: fr.home.how3Text },
  { title: fr.home.how4Title, text: fr.home.how4Text },
];

export default async function Home() {
  const { collections, templates } = await getCatalog();
  const pilot = templates.find((t) => t.slug === "le-baobab-aux-mille-secrets") ?? templates[0];

  return (
    <main>
      {/* ————— Masthead hero ————— */}
      <section className="paper-grain relative overflow-hidden">
        {/* warm dusk glow, top-right */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-40 right-[-15%] h-[560px] w-[560px] rounded-full opacity-40 blur-3xl"
          style={{ background: "radial-gradient(circle, #c08a2d66, transparent 68%)" }}
        />
        {/* ochre wash, bottom-left */}
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-48 left-[-12%] h-[420px] w-[420px] rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #b4552d55, transparent 70%)" }}
        />

        <div className="relative mx-auto grid max-w-6xl gap-14 px-4 pb-24 pt-16 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pt-24">
          <div className="animate-fade-up">
            <div className="rule-ornament max-w-md">
              <p className="eyebrow text-terra-deep">{fr.home.eyebrow}</p>
            </div>
            <h1 className="mt-8 font-display text-[2.6rem] font-semibold leading-[1.04] tracking-tight text-ink sm:text-6xl lg:text-[4.2rem]">
              Un conte africain,
              <br />
              <em className="font-medium italic text-terra-deep">rien que pour</em>
              <br />
              votre enfant.
            </h1>
            <p className="story-text mt-8 max-w-xl text-xl leading-relaxed text-ink-soft">
              {fr.home.heroSub}
            </p>
            <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-4">
              <Link
                href={pilot ? `/histoires/${pilot.slug}` : "/catalogue"}
                className="group inline-flex items-center gap-3 rounded-full bg-ink px-7 py-3.5 text-base font-medium text-paper shadow-paper transition-colors duration-300 hover:bg-terra-deep"
              >
                {fr.home.ctaPrimary}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
              <Link
                href="/catalogue"
                className="link-sweep inline-flex items-center gap-2 pb-1 text-base font-medium text-ink"
              >
                {fr.home.ctaSecondary}
                <ArrowDown className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          </div>

          {/* Cover collage */}
          {pilot ? (
            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
              {/* back card */}
              <div
                aria-hidden
                className="absolute inset-0 translate-x-6 translate-y-8 rotate-6 rounded-md bg-paper-deep shadow-paper"
              />
              {/* main cover */}
              <BookCover
                seed={pilot.id * 7919}
                title={pilot.title}
                subtitle="Le livre pilote"
                className="settle relative mx-auto max-w-[300px] rotate-2 sm:max-w-[340px] lg:max-w-[380px]"
              />
              {/* floating detail card */}
              <div className="absolute -bottom-6 -left-4 hidden rounded-lg border border-line bg-paper-card px-4 py-3 shadow-page sm:block">
                <p className="eyebrow text-ink-faint">12 pages</p>
                <p className="font-display text-sm font-semibold text-ink">Illustrées à la main</p>
              </div>
              <div className="absolute -right-3 top-8 hidden rounded-lg border border-line bg-paper-card px-4 py-3 shadow-page sm:block">
                <p className="eyebrow text-ink-faint">3–12 ans</p>
                <p className="font-display text-sm font-semibold text-ink">Trois lectures</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* scroll cue */}
        <div className="relative mx-auto flex max-w-6xl justify-center pb-10">
          <div className="flex flex-col items-center gap-2 text-ink-faint">
            <span className="eyebrow">La bibliothèque</span>
            <span className="h-10 w-px bg-gradient-to-b from-line-strong to-transparent" aria-hidden />
          </div>
        </div>
      </section>

      {/* ————— Manifesto band ————— */}
      <section className="border-y border-line/70 bg-paper-deep/50">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="eyebrow text-ochre">Notre promesse</p>
          <blockquote className="story-text mt-6 text-3xl font-medium leading-snug text-ink sm:text-[2.6rem]">
            « Le parent raconte. L’enfant vit l’histoire. Le livre reste. »
          </blockquote>
          <p className="mt-6 text-sm text-ink-soft">{fr.home.culturalNote}</p>
        </div>
      </section>

      {/* ————— Collections ————— */}
      {collections.length > 0 ? (
        <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow text-terra-deep">{fr.home.collectionsTitle}</p>
              <h2 className="mt-3 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
                Quatre horizons,
                <br />
                <em className="italic text-ink-soft">une même voix.</em>
              </h2>
            </div>
            <Link
              href="/catalogue"
              className="link-sweep inline-flex items-center gap-2 pb-1 text-sm font-medium text-ink"
            >
              {fr.catalog.startBook}
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          <ol className="mt-14 divide-y divide-line border-y border-line">
            {collections.map((c, i) => (
              <li key={c.id} className="group grid gap-3 py-8 sm:grid-cols-[4rem_1fr_auto] sm:items-baseline sm:gap-8">
                <span className="font-display text-4xl font-light italic text-clay transition-colors duration-300 group-hover:text-terra sm:text-5xl">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-display text-2xl font-semibold text-ink transition-colors duration-300 group-hover:text-terra-deep sm:text-3xl">
                    {c.titleFr}
                  </h3>
                  <p className="story-text mt-2 max-w-xl text-base text-ink-soft">{c.descriptionFr}</p>
                  {c.culturalScope ? (
                    <p className="eyebrow mt-3 text-ink-faint">{c.culturalScope}</p>
                  ) : null}
                </div>
                <ArrowRight
                  className="hidden h-5 w-5 self-center text-ink-faint transition-all duration-300 group-hover:translate-x-1 group-hover:text-terra sm:block"
                  aria-hidden
                />
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      {/* ————— How it works ————— */}
      <section className="border-t border-line/70 bg-paper-deep/40">
        <div className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
          <p className="eyebrow text-ochre">{fr.home.howTitle}</p>
          <div className="mt-14 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative border-t-2 border-ink/80 pt-6">
                <span className="font-display text-sm italic text-terra-deep">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-3 font-display text-xl font-semibold text-ink">{s.title}</h3>
                <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ————— Final CTA ————— */}
      <section className="paper-grain relative overflow-hidden bg-night text-paper">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-32 left-1/2 h-[400px] w-[700px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
          style={{ background: "radial-gradient(circle, #c08a2d88, transparent 65%)" }}
        />
        <div className="relative mx-auto max-w-4xl px-4 py-28 text-center sm:px-6">
          <p className="eyebrow text-ochre">Commencer</p>
          <h2 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">
            Le premier conte ne demande
            <br />
            <em className="italic text-clay">que quelques minutes.</em>
          </h2>
          <p className="story-text mx-auto mt-8 max-w-xl text-lg text-paper/70">
            {fr.tagline}
          </p>
          <Link
            href="/catalogue"
            className="group mt-12 inline-flex items-center gap-3 rounded-full bg-paper px-8 py-4 text-base font-medium text-ink shadow-page transition-colors duration-300 hover:bg-clay"
          >
            {fr.home.ctaSecondary}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
