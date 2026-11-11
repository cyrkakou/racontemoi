import { composeScene } from "@/lib/ai/demo-image";
import type { IllustrationInput } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

/**
 * Open-book spread: left page = editorial text, right page = atelier
 * illustration. Soft pastel "flat lay" feel — the book as a real object.
 */
export function BookSpread({
  seed,
  chapterLabel = "Chapitre Un",
  heading,
  text,
  caption,
  className,
}: {
  seed: number;
  chapterLabel?: string;
  heading: string;
  text: string;
  caption?: string;
  className?: string;
}) {
  const input: IllustrationInput = {
    pageNo: 2,
    pageKind: "story",
    sceneText: caption ?? heading,
    characterBible: {
      name: "Héros·ïne",
      description:
        "Jeune héros·ïne de la savane ouest-africaine, silhouette douce en aquarelle, proportions enfant.",
      styleTokens: {},
      bibleVersion: 1,
    },
    companionBible: null,
    stylePrefix: "",
    seed,
    aspect: "3:4",
  };
  const { svg } = composeScene(input);

  return (
    <div
      className={cn(
        "relative grid aspect-[8/5] w-full overflow-hidden rounded-2xl shadow-book",
        className,
      )}
      role="img"
      aria-label={`Livre ouvert : ${heading}`}
    >
      {/* sage-green cover margin peeking around the pages */}
      <div className="absolute inset-0 rounded-2xl bg-botanical/25" aria-hidden />
      {/* left page */}
      <div className="paper-grain relative m-[6%] mb-[7%] mr-0 rounded-l-xl border-r border-line/70 bg-paper-card pl-[9%] pr-[6%] pt-[8%] shadow-inner">
        <p className="eyebrow text-center text-ink-faint">{chapterLabel}</p>
        <h3 className="mt-2 text-center font-display text-[clamp(1rem,2.2vw,1.5rem)] font-semibold leading-snug tracking-tight text-ink">
          {heading}
        </h3>
        <p className="mx-auto mt-2 h-px w-10 bg-ochre/70" aria-hidden />
        <p className="story-text mt-[6%] text-[clamp(0.62rem,1.35vw,0.95rem)] leading-[1.75] text-ink-soft">
          {text}
        </p>
      </div>
      {/* right page */}
      <div className="paper-grain relative m-[6%] mb-[7%] ml-0 rounded-r-xl bg-paper-card p-[5%] shadow-inner">
        <div
          className="h-full w-full overflow-hidden rounded-lg [&>svg]:h-full [&>svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        {caption ? (
          <p className="story-text mt-[3%] text-center text-[clamp(0.55rem,1.1vw,0.8rem)] italic text-ink-soft">
            {caption}
          </p>
        ) : null}
      </div>
      {/* spine shadow between pages */}
      <div
        className="pointer-events-none absolute inset-y-[6%] left-1/2 w-8 -translate-x-1/2"
        aria-hidden
        style={{
          background:
            "linear-gradient(90deg, transparent, rgb(43 33 24 / 0.10) 45%, rgb(43 33 24 / 0.16) 50%, rgb(43 33 24 / 0.10) 55%, transparent)",
        }}
      />
    </div>
  );
}
