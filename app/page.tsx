import Link from "next/link";
import { ArrowRight, ChevronLeft, ChevronRight, BookOpen, Sparkles, Leaf } from "lucide-react";
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
        className="relative -mt-[4.5rem] overflow-hidden bg-cover bg-center"
        style={{ backgroundImage: "url('/hero-savanna.jpg')" }}
      >
        {/* soft veil so the painted page edges stay readable */}
        <div aria-hidden className="absolute inset-0 bg-paper/10" />

        <div className="relative mx-auto w-full px-4 pb-16 pt-[5.5rem] sm:px-6 lg:pb-20 lg:pt-24">
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
            <div className="relative mx-auto" style={{ width: "min(92vw, 82rem)" }}>
              {/* The real illustrated open book — content sits on the pages */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/open-book.png"
                alt="Livre ancien ouvert"
                className="w-full drop-shadow-[0_18px_30px_rgba(43,33,24,0.28)]"
              />

              {/* left page — desktop overlay */}
              <div className="absolute left-[9%] top-[7%] hidden h-[84%] w-[36.5%] flex-col items-center justify-start overflow-hidden text-center sm:flex">
                <p className="eyebrow tracking-[0.22em] text-terra-deep" style={{ fontSize: "clamp(0.5rem,0.85vw,0.72rem)" }}>
                  ✦ Des livres uniques ✦
                </p>
                <h1
                  className="mt-[4%] font-display font-semibold leading-[1.08] tracking-tight text-ink"
                  style={{ fontSize: "clamp(1.1rem,2.8vw,2.4rem)" }}
                >
                  Votre enfant, héros
                  <br />
                  d’une aventure{" "}
                  <em className="font-medium italic text-terra-deep">africaine.</em>
                </h1>
                <p className="mt-[3%] h-px w-12 bg-ochre/70" aria-hidden />
                <p
                  className="story-text mt-[4%] leading-[1.7] text-ink-soft"
                  style={{ fontSize: "clamp(0.6rem,1.05vw,0.88rem)" }}
                >
                  Créez un livre illustré et personnalisé, inspiré des contes,
                  de l’histoire et des imaginaires d’Afrique. Une expérience
                  magique qui éveille la fierté, la curiosité et l’amour de
                  nos cultures.
                </p>
                <div className="mt-[6%] grid grid-cols-3 gap-1.5">
                  {FEATURES.map((f) => (
                    <div key={f.label} className="flex flex-col items-center gap-1 text-center">
                      <span
                        className="grid place-items-center rounded-full bg-ochre/15 text-ochre"
                        style={{ width: "clamp(26px,3vw,42px)", height: "clamp(26px,3vw,42px)" }}
                      >
                        <f.icon className="h-[55%] w-[55%]" strokeWidth={1.6} aria-hidden />
                      </span>
                      <span className="leading-tight text-ink-soft" style={{ fontSize: "clamp(0.45rem,0.75vw,0.66rem)" }}>
                        {f.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-[7%]">
                  <Link
                    href={pilotHref}
                    className="sheen press group inline-flex items-center gap-2 rounded-full bg-terra font-medium text-paper shadow-paper transition-colors duration-300 hover:bg-terra-deep"
                    style={{ fontSize: "clamp(0.62rem,1vw,0.88rem)", padding: "0.6em 1.4em" }}
                  >
                    Créer mon livre maintenant
                    <ArrowRight className="h-[1em] w-[1em] transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </Link>
                </div>
              </div>

              {/* right page — desktop overlay */}
              <div className="absolute right-[7.5%] top-[8%] hidden h-[76%] w-[37%] flex-col items-center justify-center sm:flex">
                <div className="relative w-full flex-1 overflow-hidden rounded-[0.4rem]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/hero-savanna.jpg"
                    alt=""
                    className="h-full w-full object-cover"
                    style={{ objectPosition: "82% 96%" }}
                  />
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0"
                    style={{ boxShadow: "inset 0 0 24px rgb(247 241 229 / 0.4), inset 0 0 0 1px rgb(43 33 24 / 0.06)" }}
                  />
                </div>
                <p
                  className="story-text mt-[4%] text-center italic leading-relaxed text-ink-soft"
                  style={{ fontSize: "clamp(0.5rem,0.95vw,0.78rem)" }}
                >
                  Des contes, des royaumes, des familles et des voyages
                  d’imagination, pour grandir fier de ses racines.
                </p>
              </div>
            </div>
          </Reveal>

          {/* mobile — content stacked under the book */}
          <div className="mx-auto -mt-4 max-w-md px-2 text-center sm:hidden">
            <p className="eyebrow tracking-[0.2em] text-terra-deep">✦ Des livres uniques ✦</p>
            <h1 className="mt-4 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-ink">
              Votre enfant, héros d’une aventure{" "}
              <em className="font-medium italic text-terra-deep">africaine.</em>
            </h1>
            <p className="story-text mt-5 leading-[1.8] text-ink-soft">
              Créez un livre illustré et personnalisé, inspiré des contes,
              de l’histoire et des imaginaires d’Afrique.
            </p>
            <div className="mt-8">
              <Link
                href={pilotHref}
                className="sheen press group inline-flex items-center gap-2.5 rounded-full bg-terra px-7 py-3.5 text-base font-medium text-paper shadow-paper transition-colors duration-300 hover:bg-terra-deep"
              >
                Créer mon livre maintenant
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
              </Link>
            </div>
          </div>

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
