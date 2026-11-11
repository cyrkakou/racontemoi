// Provider-agnostic AI contracts — docs/ai-orchestration.md §1

export type AgeBand = "3-5" | "6-8" | "9-12";

export interface PersonalizationInput {
  heroName: string;
  ageBand: AgeBand;
  traits?: {
    skinTone?: string;
    hair?: string;
    outfit?: string;
  };
  companion?: boolean;
  moralEmphasis?: "ecoute" | "partage" | "courage";
}

export interface NarrativePage {
  no: number;
  kind: "cover" | "story" | "illustration_only" | "back";
  title?: string;
  textFr: string | null;
  illustrationHint: string;
}

export interface NarrativeResult {
  pages: NarrativePage[];
  provider: string;
  promptVersion?: string;
}

export interface TextProvider {
  readonly name: string;
  generateNarrative(input: {
    schema: unknown; // BookTemplateVersions.narrativeSchema
    personalization: PersonalizationInput;
    projectId: number;
  }): Promise<NarrativeResult>;
}

export interface IllustrationInput {
  pageNo: number;
  pageKind: string;
  sceneText: string;
  characterBible: {
    name: string;
    description: string;
    styleTokens: Record<string, unknown>;
    bibleVersion: number;
  };
  companionBible?: {
    name: string;
    description: string;
    styleTokens: Record<string, unknown>;
  } | null;
  stylePrefix: string;
  seed: number;
  aspect: "3:4";
}

export interface IllustrationResult {
  svg: string; // demo mode
  mime: "image/svg+xml";
  provider: string;
  promptVersion: string;
  seed: number;
}

export interface ImageProvider {
  readonly name: string;
  readonly supportsReferenceImages: boolean;
  generateScene(input: IllustrationInput): Promise<IllustrationResult>;
}
