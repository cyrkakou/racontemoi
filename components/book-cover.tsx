import { composeScene } from "@/lib/ai/demo-image";
import type { IllustrationInput } from "@/lib/ai/types";
import { cn } from "@/lib/utils";

/**
 * Server-rendered book cover: deterministic atelier SVG scene + editorial title.
 * Same compositor as the demo illustration provider → catalog and finished
 * books share one visual language.
 */
export function BookCover({
  seed,
  title,
  subtitle,
  className,
  heroName,
}: {
  seed: number;
  title: string;
  subtitle?: string;
  className?: string;
  heroName?: string;
}) {
  const input: IllustrationInput = {
    pageNo: 1,
    pageKind: "cover",
    sceneText: subtitle ?? title,
    characterBible: {
      name: heroName ?? "Héros·ïne",
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
      className={cn("cover-frame relative aspect-[3/4] w-full overflow-hidden rounded-md", className)}
      role="img"
      aria-label={`Couverture : ${title}`}
    >
      <div
        className="absolute inset-0 [&>svg]:h-full [&>svg]:w-full"
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      <div className="cover-spine" aria-hidden />
      {/* Editorial title plate */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-night/90 via-night/45 to-transparent px-5 pb-5 pt-20">
        {subtitle ? (
          <p className="eyebrow mb-2 text-paper/70">{subtitle}</p>
        ) : null}
        <p className="font-display text-balance text-xl font-semibold leading-tight text-paper sm:text-2xl">
          {title}
        </p>
        <p className="mt-2 h-px w-10 bg-ochre" aria-hidden />
      </div>
    </div>
  );
}
