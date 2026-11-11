import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BookSpread } from "@/components/book-spread";
import { Reveal, Tilt, Drift } from "@/components/motion";
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

/* Small decorative shapes — the "toys" scattered around the book,
   echoing the reference flat-lay. */
function Star({ className, color = "#c08a2d" }: { className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8L12 2z"
        fill={color}
        opacity="0.55"
      />
    </svg>
  );
}
function Leaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M4 20C4 10 10 4 20 4c0 10-6 16-16 16z"
        stroke="#3e5c33"
        strokeWidth="1.6"
        opacity="0.5"
      />
      <path d="M4 20C8 14 12 10 18 7" stroke="#3e5c33" strokeWidth="1.2" opacity="0.35" />
    </svg>
  );
}
function Moon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M20 14.5A8.5 8.5 0 119.5 4 6.8 6.8 0 0020 14.5z"
        fill="#d9c7a7"
        opacity="0.65"
      />
    </svg>
  );
}

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

        {/* floating decorations, like toys around the book */}
        <Drift className="absolute left-[6%] top-[18%] hidden lg:block" duration={8}>
          <Star className="h-10 w-10" />
        </Drift>
        <Drift className="absolute right-[8%] top-[24%] hidden lg:block" duration={11} delay={1.2}>
          <Leaf className="h-12 w-12" />
        </Drift>
        <Drift className="absolute left-[12%] bottom-[30%] hidden lg:block" duration={10} delay={0.6}>
          <Moon className="h-12 w-12" />
        </Drift>
        <Drift className="absolute right-[13%] bottom-[24%] hidden lg:block" duration={9} delay={2}>
          <Star className="h-7 w-7" color="#b4552d" />
        </Drift>

        {/* The hero IS the open book — everything lives inside the pages */}
        <div className="relative mx-auto max-w-5xl px-4 pb-28 pt-14 sm:px-6 lg:pt-16">
          <Reveal>
            <Tilt max={3}>
              <BookSpread seed={(pilot?.id ?? 1) * 7919} caption="Chaque page, peinte à la main, rien que pour votre enfant.">
                <p className="eyebrow text-center text-terra-deep">{fr.home.eyebrow}</p>
                <h1 className="mt-4 text-center font-display text-[clamp(1.5rem,3.2vw,2.6rem)] font-semibold leading-[1.1] tracking-tight text-ink">
                  Un conte africain,
                  <br />
                  <em className="font-medium italic text-terra-deep">rien que pour votre enfant.</em>
                </h1>
                <p className="mx-auto mt-4 h-px w-12 bg-ochre/70" aria-hidden />
                <p className="story-text mt-5 flex-1 text-center text-[clamp(0.8rem,1.5vw,1rem)] leading-[1.8] text-ink-soft">
                  {fr.home.heroSub}
                </p>
                <div className="mt-[8%] flex flex-wrap items-center justify-center gap-x-5 gap-y-3 pb-1">
                  <Link
                    href={pilot ? `/histoires/${pilot.slug}` : "/catalogue"}
                    className="sheen press group inline-flex items-center gap-2 rounded-full bg-terra px-5 py-2.5 text-sm font-medium text-paper shadow-paper transition-colors duration-300 hover:bg-terra-deep"
                  >
                    {fr.home.ctaPrimary}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" aria-hidden />
                  </Link>
                  <Link
                    href="/catalogue"
                    className="link-sweep press inline-flex items-center gap-2 pb-0.5 text-sm font-medium text-ink"
                  >
                    {fr.home.ctaSecondary}
                  </Link>
                </div>
              </BookSpread>
            </Tilt>
          </Reveal>
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
