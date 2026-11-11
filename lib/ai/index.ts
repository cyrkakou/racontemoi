import type { ImageProvider, TextProvider } from "./types";
import { demoTextProvider } from "./demo-text";
import { demoImageProvider } from "./demo-image";

export function aiMode(): "demo" | "live" {
  return process.env.AI_PROVIDER === "live" ? "live" : "demo";
}

export function getTextProvider(): TextProvider {
  // Live adapter is added in Phase 4 when vendor keys exist.
  return demoTextProvider;
}

export function getImageProvider(): ImageProvider {
  return demoImageProvider;
}

export { type AgeBand, type IllustrationInput, type IllustrationResult, type NarrativePage, type NarrativeResult, type PersonalizationInput, type TextProvider, type ImageProvider } from "./types";
