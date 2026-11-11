import type { IllustrationInput } from "@/lib/ai/types";

// Shared scene layout — used by demo-image (SVG strings) and lib/pdf (vector ops).
// Same seed → same composition everywhere.

export interface ScenePalette {
  skyTop: string;
  skyBottom: string;
  sun: string;
  ground: string;
  groundDeep: string;
  accent: string;
  ink: string;
}

export interface SceneLayout {
  palette: ScenePalette;
  horizon: number;
  sunX: number;
  sunY: number;
  sunR: number;
  haloR: number;
  birds: { x: number; y: number; s: number }[];
  tufts: { x: number; y: number; s: number }[];
  tree: { x: number; baseY: number; s: number } | null;
  companion: { x: number; y: number; s: number } | null;
  hero: {
    x: number;
    y: number;
    s: number;
    skin: string;
    outfit: string;
    hair: string;
    hairStyle: "afro" | "short" | "braids";
  };
}

export const PALETTES: ScenePalette[] = [
  {
    skyTop: "#e8b96a",
    skyBottom: "#c98d63",
    sun: "#f2d492",
    ground: "#8a6a42",
    groundDeep: "#5c4a30",
    accent: "#3e5c33",
    ink: "#3a2c1c",
  },
  {
    skyTop: "#d9a05b",
    skyBottom: "#b97e52",
    sun: "#f5d9a0",
    ground: "#7a5c3a",
    groundDeep: "#4f3d28",
    accent: "#b4552d",
    ink: "#33261c",
  },
];

const SKIN_TONES = ["#8a5a3b", "#a06a42", "#b97e52", "#8f4f33", "#c98d63", "#6f452c"];
const OUTFITS = ["#b4552d", "#3e5c33", "#c08a2d", "#5b6e8c", "#7a4a5e"];
const HAIRS = ["#241a12", "#3d2a1a", "#14100c"];

export function hash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

/** SVG path data for the baobab silhouette — parseable by pdf-lib drawSvgPath. */
export function baobabPath(x: number, baseY: number, s: number): string {
  return [
    `M ${x} ${baseY}`,
    `C ${x - 14 * s} ${baseY - 60 * s}, ${x - 10 * s} ${baseY - 130 * s}, ${x - 26 * s} ${baseY - 165 * s}`,
    `C ${x - 34 * s} ${baseY - 185 * s}, ${x - 30 * s} ${baseY - 200 * s}, ${x - 38 * s} ${baseY - 215 * s}`,
    `C ${x - 12 * s} ${baseY - 205 * s}, ${x + 2 * s} ${baseY - 195 * s}, ${x + 8 * s} ${baseY - 205 * s}`,
    `C ${x + 16 * s} ${baseY - 195 * s}, ${x + 22 * s} ${baseY - 180 * s}, ${x + 14 * s} ${baseY - 160 * s}`,
    `C ${x + 30 * s} ${baseY - 140 * s}, ${x + 18 * s} ${baseY - 90 * s}, ${x + 22 * s} ${baseY - 40 * s}`,
    `C ${x + 24 * s} ${baseY - 15 * s}, ${x + 14 * s} ${baseY} ${x + 14 * s} ${baseY}`,
    `L ${x - 14 * s} ${baseY}`,
    `C ${x - 12 * s} ${baseY - 30 * s}, ${x - 20 * s} ${baseY - 80 * s}, ${x - 12 * s} ${baseY - 140 * s}`,
    `C ${x - 4 * s} ${baseY - 165 * s}, ${x - 8 * s} ${baseY - 185 * s}, ${x - 2 * s} ${baseY - 200 * s}`,
    `C ${x + 4 * s} ${baseY - 190 * s}, ${x + 2 * s} ${baseY - 170 * s}, ${x + 10 * s} ${baseY - 150 * s}`,
    `C ${x + 2 * s} ${baseY - 100 * s}, ${x - 2 * s} ${baseY - 50 * s}, ${x} ${baseY - 20 * s} Z`,
  ].join(" ");
}

export function mulberry(seed: number) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function computeSceneLayout(input: IllustrationInput): SceneLayout {
  const rnd = mulberry(input.seed);
  const palette = PALETTES[input.seed % PALETTES.length];
  const bibleHash = hash(input.characterBible.name + input.characterBible.description);

  const horizon = 560 + Math.floor(rnd() * 30);
  const heroX = 180 + Math.floor(rnd() * 240);
  const heroY = horizon - 60 - Math.floor(rnd() * 40);

  const tufts = Array.from({ length: 14 }, () => ({
    x: 30 + rnd() * 540,
    y: horizon + 30 + rnd() * 160,
    s: 0.7 + rnd() * 0.8,
  }));

  const birds = Array.from({ length: 2 }, (_, i) => ({
    x: 140 + i * 160 + rnd() * 60,
    y: 140 + rnd() * 80 + i * 30,
    s: 0.8 + rnd() * 0.5,
  }));

  return {
    palette,
    horizon,
    sunX: 600 * 0.72,
    sunY: horizon - 140,
    sunR: 52,
    haloR: 180,
    birds,
    tufts,
    tree: { x: 380 + Math.floor(rnd() * 120), baseY: horizon + 120, s: 0.9 + rnd() * 0.35 },
    companion: input.companionBible
      ? { x: heroX + 90, y: heroY - 120, s: 1 }
      : null,
    hero: {
      x: heroX,
      y: heroY,
      s: 1.15,
      skin: SKIN_TONES[bibleHash % SKIN_TONES.length],
      outfit: OUTFITS[(bibleHash >>> 3) % OUTFITS.length],
      hair: HAIRS[bibleHash % 3],
      hairStyle: bibleHash % 3 === 0 ? "afro" : bibleHash % 3 === 1 ? "short" : "braids",
    },
  };
}
