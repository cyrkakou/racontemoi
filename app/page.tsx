import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen, Sparkles, Leaf } from "lucide-react";
import { BookSpread } from "@/components/book-spread";
import { Reveal } from "@/components/motion";
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

const FEATURES = [
  { icon: BookOpen, label: "Des histoires originales" },
  { icon: Sparkles, label: "Une personnalisation magique" },
  { icon: Leaf, label: "Un cadeau qui a du sens" },
];

export default async function Home() {
  const pilot = await getPilot();
  const pilotHref = pilot ? `/histoires/${pilot.slug}` : "/catalogue";

  return (
    <main>
      {/* ————— Hero : la page entière EST le livre ouvert ————— */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-savanna.jpg')" }}
      >
        {/* soft veil so the painted page edges stay readable */}
        <div aria-hidden className="absolute inset-0 bg-paper/10" />

        <div className="relative mx-auto max-w-5xl px-4 pb-24 pt-10 sm:px-6 lg:pb-28 lg:pt-14">
          {/* carousel arrows — decorative, echo the reference mockup */}
          <button
            aria-hidden
            tabIndex={-1}
            className="pointer-events-none absolute left-[1%] top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper-card/90 text-ink shadow-paper md:flex"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            aria-hidden
            tabIndex={-1}
            className="pointer-events-none absolute right-[1%] top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-paper-card/90 text-ink shadow-paper md:flex"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <Reveal>
            <BookSpread
              seed={(pilot?.id ?? 1) * 7919}
              illustrationSrc="/hero-savanna.jpg"
              illustrationPosition="78% 88%"
              caption="Des contes, des royaumes, des familles et des voyages d’imagination, pour grandir fier de ses racines."
            >
              <p className="eyebrow text-center tracking-[0.24em] text-terra-deep">
                ✦ Des livres uniques ✦
              </p>
              <h1 className="mt-4 text-center font-display text-[clamp(1.55rem,3.4vw,2.7rem)] font-semibold leading-[1.08] tracking-tight text-ink">
                Votre enfant, héros
                <br />
                d’une aventure{" "}
                <em className="font-medium italic text-terra-deep">africaine.</em>
              </h1>
              <p className="mx-auto mt-4 h-px w-14 bg-ochre/70" aria-hidden />
              <p className="story-text mt-4 text-center text-[clamp(0.72rem,1.4vw,0.95rem)] leading-[1.75] text-ink-soft">
                Créez un livre illustré et personnalisé, inspiré des contes,
                de l’histoire et des imaginaires d’Afrique. Une expérience magique
                qui éveille la fierté, la curiosité et l’amour de nos cultures.
              </p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {FEATURES.map((f) => (
                  <div key={f.label} className="flex flex-col items-center gap-1.5 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-ochre/15 text-ochre">
                      <f.icon className="h-5 w-5" strokeWidth={1.6} aria-hidden />
                    </span>
                    <span className="text-[0.72rem] font-medium leading-tight text-ink-soft">
                      {f.label}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-[6%] flex justify-center pb-1">
                <Link
                  href={pilotHref}
                  className="sheen press group inline-flex items-center gap-2.5 rounded-full bg-terra px-6 py-3 text-sm font-medium text-paper shadow-paper transition-colors duration-300 hover:bg-terra-deep"
                >
                  Créer mon livre maintenant
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                </Link>
              </div>
            </BookSpread>
          </Reveal>

          {/* carousel dots under the book */}
          <div className="mt-10 flex items-center justify-center gap-2.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-terra" />
            <span className="h-2 w-2 rounded-full bg-ink/25" />
            <span className="h-2 w-2 rounded-full bg-ink/25" />
            <span className="h-2 w-2 rounded-full bg-ink/25" />
          </div>
        </div>
      </section>

      {/* ————— How it works ————— */}
      <section className="mx-auto max-w-6xl px-4 py-24 sm:px-6">
        <Reveal className="text-center">
          <p className="eyebrow text-ochre">{fr.home.howTitle}</p>
        </Reveal>
        <div className="mt-16 grid gap-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {STEPS.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.1} className="text-center">
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-full border border-line bg-paper-card font-display text-lg italic text-terra-deep shadow-paper">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="mt-5 font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-3 text-[0.95rem] leading-relaxed text-ink-soft">{s.text}</p>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}
