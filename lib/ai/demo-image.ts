import type {
  IllustrationInput,
  IllustrationResult,
  ImageProvider,
} from "./types";
import { baobabPath, computeSceneLayout } from "@/lib/illustration/scene-layout";

// Deterministic zero-cost illustration compositor (demo mode, default).
// Produces real SVG "atelier" plates — consistent hero mark derived from the
// character bible, watercolor-wash palette locked per book.

const PROMPT_VERSION = "demo-image-v1";

function heroFigure(
  x: number,
  y: number,
  s: number,
  skin: string,
  outfit: string,
  hair: string,
  hairStyle: "afro" | "short" | "braids",
): string {
  const hairEl =
    hairStyle === "afro"
      ? `<circle cx="${x}" cy="${y - 73 * s}" r="${12.5 * s}" fill="${hair}" opacity="0.9"/><circle cx="${x}" cy="${y - 70 * s}" r="${11 * s}" fill="${skin}"/>`
      : hairStyle === "braids"
        ? `<path d="M ${x - 11 * s} ${y - 72 * s} Q ${x} ${y - 90 * s} ${x + 11 * s} ${y - 72 * s} L ${x + 12 * s} ${y - 60 * s} Q ${x} ${y - 70 * s} ${x - 12 * s} ${y - 60 * s} Z" fill="${hair}"/>`
        : `<path d="M ${x - 11 * s} ${y - 72 * s} Q ${x} ${y - 88 * s} ${x + 11 * s} ${y - 72 * s} L ${x + 10 * s} ${y - 66 * s} Q ${x} ${y - 74 * s} ${x - 10 * s} ${y - 66 * s} Z" fill="${hair}"/>`;

  return [
    `<ellipse cx="${x}" cy="${y + 2}" rx="${18 * s}" ry="${4 * s}" fill="#3a2c1c" opacity="0.18"/>`,
    `<rect x="${x - 7 * s}" y="${y - 26 * s}" width="${6 * s}" height="${26 * s}" rx="${3 * s}" fill="${outfit}"/>`,
    `<rect x="${x + 1 * s}" y="${y - 26 * s}" width="${6 * s}" height="${26 * s}" rx="${3 * s}" fill="${outfit}"/>`,
    `<path d="M ${x - 11 * s} ${y - 26 * s} Q ${x} ${y - 34 * s} ${x + 11 * s} ${y - 26 * s} L ${x + 9 * s} ${y - 58 * s} Q ${x} ${y - 64 * s} ${x - 9 * s} ${y - 58 * s} Z" fill="${outfit}"/>`,
    `<path d="M ${x - 10 * s} ${y - 56 * s} Q ${x - 16 * s} ${y - 44 * s} ${x - 14 * s} ${y - 34 * s}" stroke="${skin}" stroke-width="${4.5 * s}" stroke-linecap="round" fill="none"/>`,
    `<path d="M ${x + 10 * s} ${y - 56 * s} Q ${x + 16 * s} ${y - 44 * s} ${x + 14 * s} ${y - 34 * s}" stroke="${skin}" stroke-width="${4.5 * s}" stroke-linecap="round" fill="none"/>`,
    `<circle cx="${x}" cy="${y - 70 * s}" r="${11 * s}" fill="${skin}"/>`,
    hairEl,
    `<circle cx="${x - 3.5 * s}" cy="${y - 70 * s}" r="${1.1 * s}" fill="#2b2118"/><circle cx="${x + 3.5 * s}" cy="${y - 70 * s}" r="${1.1 * s}" fill="#2b2118"/>`,
  ].join("\n    ");
}

function escapeXml(s: string): string {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function composeScene(input: IllustrationInput): IllustrationResult {
  const L = computeSceneLayout(input);
  const p = L.palette;
  const W = 600;
  const H = 800;

  const bird = L.companion
    ? `<g transform="translate(${L.companion.x},${L.companion.y})" opacity="0.85">
         <path d="M0 0 Q8 -10 16 0 Q8 6 0 0 Z" fill="${p.accent}"/>
         <path d="M16 0 L24 -3 L17 4 Z" fill="${p.accent}"/>
         <circle cx="4" cy="-2" r="1.2" fill="#2b2118"/>
       </g>`
    : "";

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.skyTop}"/>
      <stop offset="1" stop-color="${p.skyBottom}"/>
    </linearGradient>
    <linearGradient id="ground" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="${p.ground}"/>
      <stop offset="1" stop-color="${p.groundDeep}"/>
    </linearGradient>
    <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="${p.sun}" stop-opacity="0.95"/>
      <stop offset="1" stop-color="${p.sun}" stop-opacity="0"/>
    </radialGradient>
    <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter>
    <filter id="wc"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.02" numOctaves="3" seed="${input.seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="14"/></filter>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#sky)"/>
  <circle cx="${L.sunX}" cy="${L.sunY}" r="${L.haloR}" fill="url(#sun)"/>
  <circle cx="${L.sunX}" cy="${L.sunY}" r="${L.sunR}" fill="${p.sun}" opacity="0.9"/>

  <g stroke="#5c4f3f" stroke-width="2" fill="none" opacity="0.5">
    ${L.birds.map((b) => `<path d="M ${b.x} ${b.y} q ${6 * b.s} ${-6 * b.s} ${12 * b.s} 0 q ${6 * b.s} ${-6 * b.s} ${12 * b.s} 0"/>`).join("\n    ")}
  </g>

  <path d="M0 ${L.horizon} Q ${W / 2} ${L.horizon - 24} ${W} ${L.horizon} L ${W} ${H} L 0 ${H} Z" fill="url(#ground)"/>
  <path d="M0 ${L.horizon + 60} Q ${W / 2} ${L.horizon + 40} ${W} ${L.horizon + 60} L ${W} ${H} L 0 ${H} Z" fill="${p.groundDeep}" opacity="0.55"/>

  <g stroke="${p.accent}" stroke-width="2.5" stroke-linecap="round" opacity="0.7">
    ${L.tufts.map((t) => `<path d="M${t.x} ${t.y} q -3 ${-14 * t.s} -8 ${-20 * t.s} M${t.x + 4} ${t.y} q 0 ${-16 * t.s} 4 ${-24 * t.s} M${t.x + 8} ${t.y} q 4 ${-12 * t.s} 10 ${-18 * t.s}"/>`).join("\n    ")}
  </g>

  ${L.tree ? `<g filter="url(#wc)"><path d="${baobabPath(L.tree.x, L.tree.baseY, L.tree.s)}" fill="${p.ink}" opacity="0.92"/></g>` : ""}

  ${bird}

  <g filter="url(#wc)">
    ${heroFigure(L.hero.x, L.hero.y, L.hero.s, L.hero.skin, L.hero.outfit, L.hero.hair, L.hero.hairStyle)}
  </g>

  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" fill="none" stroke="#f7f1e5" stroke-width="2" opacity="0.5"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" fill="none" stroke="#f7f1e5" stroke-width="1" opacity="0.3"/>

  <text x="30" y="${H - 40}" font-family="Georgia, serif" font-size="20" fill="#f7f1e5" opacity="0.85" font-style="italic">${escapeXml(input.sceneText.slice(0, 60))}</text>

  <rect width="${W}" height="${H}" filter="url(#grain)" opacity="0.06"/>
</svg>`;

  return {
    svg,
    mime: "image/svg+xml",
    provider: "demo-image",
    promptVersion: PROMPT_VERSION,
    seed: input.seed,
  };
}

export const demoImageProvider: ImageProvider = {
  name: "demo-image",
  supportsReferenceImages: false,
  async generateScene(input) {
    return composeScene(input);
  },
};
