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
      className={cn("relative w-full overflow-hidden rounded-[1.4rem] p-[3.2%] pb-[4.5%]", className)}
      role="img"
      aria-label={`Livre ouvert : ${heading}`}
      style={{ background: "linear-gradient(160deg, #d7e3cc, #c9d9bc 60%, #bfceb2)" }}
    >
      {/* book shadow under the open pages */}
      <div
        aria-hidden
        className="absolute inset-x-[6%] bottom-[2.4%] h-6 rounded-[50%] bg-ink/20 blur-md"
      />
      <div className="relative grid grid-cols-2 overflow-hidden rounded-lg">
        {/* left page */}
        <div className="paper-grain relative flex flex-col bg-paper-card px-[8%] py-[8%]">
          <p className="eyebrow text-center text-ink-faint">{chapterLabel}</p>
          <h3 className="mt-2 text-center font-display text-[clamp(0.95rem,2vw,1.45rem)] font-semibold leading-snug tracking-tight text-ink">
            {heading}
          </h3>
          <p className="mx-auto mt-2.5 h-px w-9 bg-ochre/70" aria-hidden />
          <p className="story-text mt-[7%] flex-1 text-[clamp(0.62rem,1.25vw,0.92rem)] leading-[1.8] text-ink-soft">
            {text}
          </p>
          <p className="mt-[6%] text-center font-display text-xs italic text-ink-faint" aria-hidden>6</p>
        </div>
        {/* spine shadow */}
        <div
          className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2"
          aria-hidden
          style={{
            background:
              "linear-gradient(90deg, transparent, rgb(43 33 24 / 0.07) 40%, rgb(43 33 24 / 0.14) 50%, rgb(43 33 24 / 0.07) 60%, transparent)",
          }}
        />
        {/* right page */}
        <div className="paper-grain relative flex flex-col bg-paper-card p-[6%]">
          <div
            className="aspect-[3/4] w-full max-h-full flex-1 overflow-hidden rounded-md [&>svg]:h-full [&>svg]:w-full [&>svg]:object-cover"
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          {caption ? (
            <p className="story-text mt-[4%] text-center text-[clamp(0.55rem,1vw,0.78rem)] italic leading-relaxed text-ink-soft">
              {caption}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
