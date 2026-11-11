import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookSpread } from "@/components/book-spread";
import { fr } from "@/lib/i18n/fr";
import { getDb } from "@/lib/db";
import { bookTemplates } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

async function getPilot() {
  try {
    const db = getDb();
    const templates = await db
      .select()
      .from(bookTemplates)
      .where(eq(bookTemplates.editorialStatus, "published"));
    return templates.find((t) => t.slug === "le-baobab-aux-mille-secrets") ?? templates[0] ?? null;
  } catch {
    return null;
  }
}

const STEPS = [
  { title: fr.home.how1Title, text: fr.home.how1Text },
  { title: fr.home.how2Title, text: fr.home.how2Text },
  { title: fr.home.how3Title, text: fr.home.how3Text },
  { title: fr.home.how4Title, text: fr.home.how4Text },
];

export default async function Home() {
  const pilot = await getPilot();

  return (
    <main>
      {/* ————— Hero : le livre ouvert ————— */}
      <section className="paper-grain relative overflow-hidden bg-blush/50">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, #d7e3cc, transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 bottom-10 h-80 w-80 rounded-full opacity-60 blur-3xl"
          style={{ background: "radial-gradient(circle, #ecd4c6, transparent 70%)" }}
        />

        <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-16 text-center sm:px-6 lg:pt-20">
          <div className="rule-ornament mx-auto max-w-xs">
            <p className="eyebrow text-terra-deep">{fr.home.eyebrow}</p>
          </div>
          <h1 className="mx-auto mt-8 max-w-3xl font-display text-[2.5rem] font-semibold leading-[1.06] tracking-tight text-ink sm:text-6xl">
            Un conte africain,
            <br />
            <em className="font-medium italic text-terra-deep">rien que pour votre enfant.</em>
          </h1>
          <p className="story-text mx-auto mt-7 max-w-xl text-lg leading-relaxed text-ink-soft">
            {fr.home.heroSub}
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
            <Link
              href={pilot ? `/histoires/${pilot.slug}` : "/catalogue"}
              className="group inline-flex items-center gap-3 rounded-full bg-terra px-7 py-3.5 text-base font-medium text-paper shadow-paper transition-colors duration-300 hover:bg-terra-deep"
            >
              {fr.home.ctaPrimary}
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
            </Link>
            <Link
              href="/catalogue"
              className="link-sweep inline-flex items-center gap-2 pb-1 text-base font-medium text-ink"
            >
              {fr.home.ctaSecondary}
            </Link>
          </div>
        </div>

        {/* open-book centerpiece */}
        {pilot ? (
          <div className="relative mx-auto max-w-4xl px-4 pb-24 sm:px-6">
            <BookSpread
              seed={pilot.id * 7919}
              heading="Le Baobab aux Mille Secrets"
              text="Au cœur de la savane dorée, là où le vent sait tous les noms, se dresse un baobab plus vieux que les étoiles. Dans son tronc large comme une maison, les secrets du village dorment depuis cent générations — et attendent quelqu’un de courageux pour les écouter."
              caption="Chaque page, peinte à la main, rien que pour votre enfant."
              className="settle"
            />
          </div>
        ) : null}
      </section>

      {/* ————— Manifesto band ————— */}
      <section className="border-y border-line/70 bg-sage/30">
        <div className="mx-auto max-w-4xl px-4 py-20 text-center sm:px-6">
          <p className="eyebrow text-botanical">Notre promesse</p>
          <blockquote className="story-text mt-6 text-3xl font-medium leading-snug text-ink sm:text-[2.4rem]">
            « Le parent raconte. L’enfant vit l’histoire. Le livre reste. »
          </blockquote>
          <p className="mt-6 text-sm text-ink-soft">{fr.home.culturalNote}</p>
        </div>
      </section>

      {/* ————— How it works ————— */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <div className="text-center">
          <p className="eyebrow text-ochre">{fr.home.howTitle}</p>
        </div>
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <div key={s.title} className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-line bg-paper-card font-display text-lg italic text-terra-deep shadow-paper">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ————— Final CTA ————— */}
      <section className="paper-grain relative overflow-hidden bg-blush-deep/60">
        <div className="relative mx-auto max-w-4xl px-4 py-24 text-center sm:px-6">
          <p className="eyebrow text-terra-deep">Commencer</p>
          <h2 className="mt-6 font-display text-4xl font-semibold leading-tight tracking-tight text-ink sm:text-5xl">
            Le premier conte ne demande
            <br />
            <em className="italic text-terra-deep">que quelques minutes.</em>
          </h2>
          <p className="story-text mx-auto mt-7 max-w-xl text-lg text-ink-soft">
            {fr.tagline}
          </p>
          <Link
            href="/catalogue"
            className="group mt-10 inline-flex items-center gap-3 rounded-full bg-ink px-8 py-4 text-base font-medium text-paper shadow-page transition-colors duration-300 hover:bg-terra-deep"
          >
            {fr.home.ctaSecondary}
            <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </section>
    </main>
  );
}
