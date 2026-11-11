import { composeScene } from "@/lib/ai/demo-image";
import type { IllustrationInput } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

/**
 * Open-book spread: left page = editorial content, right page = illustration.
 * Soft "flat lay" feel — the book as a real object on the painted background.
 * Pass `illustrationSrc` to show a real image instead of the demo scene.
 */
export function BookSpread({
  seed,
  chapterLabel = "Chapitre Un",
  heading,
  text,
  caption,
  className,
  children,
  illustrationSrc,
  illustrationPosition = "76% 82%",
}: {
  seed: number;
  chapterLabel?: string;
  heading?: string;
  text?: string;
  caption?: string;
  className?: string;
  children?: React.ReactNode;
  illustrationSrc?: string;
  illustrationPosition?: string;
}) {
  let svg: string | null = null;
  if (!illustrationSrc) {
    const input: IllustrationInput = {
      pageNo: 2,
      pageKind: "story",
      sceneText: caption ?? heading ?? "Illustration",
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
    svg = composeScene(input).svg;
  }

  return (
    <div
      className={cn("relative w-full overflow-hidden rounded-[0.9rem] p-[1.8%] pb-[3%]", className)}
      role="img"
      aria-label={heading ? `Livre ouvert : ${heading}` : "Livre ouvert"}
      style={{
        background: "linear-gradient(160deg, #b3c9a3, #9bb488 55%, #87a275)",
        boxShadow: "var(--shadow-book)",
      }}
    >
      {/* page-edge stack — bottom + right, like a real closed-stack */}
      <div
        aria-hidden
        className="absolute bottom-[1.6%] left-[3.4%] right-[3.4%] h-[1.5%] rounded-b-md"
        style={{ background: "repeating-linear-gradient(180deg, #f7f1e5 0 2px, #d8cbae 2px 3px)" }}
      />
      <div
        aria-hidden
        className="absolute right-[0.9%] top-[4%] bottom-[5%] w-[1.2%] rounded-r-sm"
        style={{ background: "repeating-linear-gradient(90deg, #f7f1e5 0 2px, #d8cbae 2px 3px)" }}
      />
      {/* bookmark ribbon hanging from the bottom center */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 h-12 w-[1.6%] min-w-[10px] max-w-[18px] -translate-x-1/2 translate-y-[74%] bg-terra"
        style={{ clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% 82%, 0 100%)" }}
      />
      {/* book shadow under the open pages */}
      <div
        aria-hidden
        className="absolute inset-x-[8%] bottom-[1.2%] h-5 rounded-[50%] bg-ink/25 blur-md"
      />

      <div className="relative grid grid-cols-1 overflow-hidden rounded-[0.3rem] sm:grid-cols-2">
        {/* left page */}
        <div className="paper-grain relative flex flex-col bg-paper-card px-[8%] py-[9%]">
          {children ?? (
            <>
              <p className="eyebrow text-center text-ink-faint">{chapterLabel}</p>
              <h3 className="mt-2 text-center font-display text-[clamp(0.95rem,2vw,1.45rem)] font-semibold leading-snug tracking-tight text-ink">
                {heading}
              </h3>
              <p className="mx-auto mt-2.5 h-px w-9 bg-ochre/70" aria-hidden />
              <p className="story-text mt-[7%] flex-1 text-[clamp(0.62rem,1.25vw,0.92rem)] leading-[1.8] text-ink-soft">
                {text}
              </p>
              <p className="mt-[6%] text-center font-display text-xs italic text-ink-faint" aria-hidden>6</p>
            </>
          )}
        </div>
        {/* spine fold shadow */}
        <div
          className="absolute inset-y-0 left-1/2 w-12 -translate-x-1/2"
          aria-hidden
          style={{
            background:
              "linear-gradient(90deg, transparent, rgb(43 33 24 / 0.08) 38%, rgb(43 33 24 / 0.16) 50%, rgb(43 33 24 / 0.08) 62%, transparent)",
          }}
        />
        {/* right page */}
        <div className="paper-grain relative flex flex-col bg-paper-card p-[4.5%]">
          <div className="relative w-full flex-1 overflow-hidden rounded-[0.25rem]">
            {illustrationSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={illustrationSrc}
                alt=""
                className="h-full w-full object-cover"
                style={{ objectPosition: illustrationPosition }}
              />
            ) : svg ? (
              <div
                className="h-full w-full [&>svg]:h-full [&>svg]:w-full"
                dangerouslySetInnerHTML={{ __html: svg }}
              />
            ) : null}
            {/* watercolor wash soften the print edges */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{ boxShadow: "inset 0 0 0 1px rgb(43 33 24 / 0.06), inset 0 0 24px rgb(247 241 229 / 0.35)" }}
            />
          </div>
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
