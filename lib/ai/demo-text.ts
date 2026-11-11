import type {
  AgeBand,
  NarrativePage,
  NarrativeResult,
  PersonalizationInput,
  TextProvider,
} from "./types";

// Deterministic zero-cost narrative renderer (demo mode, default).
// Fills the approved narrative_schema slots — never invents new beats.

interface SchemaPage {
  no: number;
  kind: NarrativePage["kind"];
  title?: string;
  illustrationHint: string;
  text?: { base?: string; bands?: Partial<Record<AgeBand, string>> };
  moralVariants?: Record<string, Partial<Record<AgeBand, string>>>;
}

interface NarrativeSchema {
  pageCount: number;
  pages: SchemaPage[];
}

const PROMPT_VERSION = "demo-text-v1";

function pickBandText(page: SchemaPage, band: AgeBand, moral?: string): string | null {
  if (page.moralVariants && moral && page.moralVariants[moral]) {
    return page.moralVariants[moral][band] ?? null;
  }
  const t = page.text;
  if (!t) return null;
  return t.bands?.[band] ?? t.base ?? null;
}

function render(template: string, p: PersonalizationInput): string {
  const companionName = "Nzoma";
  return template
    .replaceAll("{{hero}}", p.heroName)
    .replaceAll("{{companion}}", p.companion ? companionName : "le vent")
    .replaceAll("{{moral}}", p.moralEmphasis ?? "ecoute");
}

export const demoTextProvider: TextProvider = {
  name: "demo-text",
  async generateNarrative({ schema, personalization }) {
    const s = schema as NarrativeSchema;
    const pages: NarrativePage[] = s.pages.map((page) => {
      const raw = pickBandText(page, personalization.ageBand, personalization.moralEmphasis);
      const textFr = raw === null ? null : render(raw, personalization);
      return {
        no: page.no,
        kind: page.kind,
        title: page.title,
        textFr,
        illustrationHint: render(page.illustrationHint, personalization),
      };
    });

    const result: NarrativeResult = {
      pages,
      provider: this.name,
      promptVersion: PROMPT_VERSION,
    };
    return result;
  },
};
