import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import {
  baobabPath,
  computeSceneLayout,
  type SceneLayout,
} from "@/lib/illustration/scene-layout";
import type { IllustrationInput } from "@/lib/ai/types";

// Memory-bounded PDF composer — pure JS (pdf-lib), no native deps.
// Demo-mode illustrations are SVG → redrawn as vector ops sharing the same
// scene layout. Live-mode rasters (PNG/JPEG) embed directly.

const PAGE_W = 432;
const PAGE_H = 648;
const INK = "#2b2118";
const PAPER = "#f7f1e5";
const SCENE_W = 600;
const SCENE_H = 800;

function hexToRgb(hex: string) {
  const h = hex.replace("#", "");
  return rgb(
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  );
}

function lerpColor(a: string, b: string, t: number): string {
  const pa = [1, 3, 5].map((i) => parseInt(a.slice(i, i + 2), 16));
  const pb = [1, 3, 5].map((i) => parseInt(b.slice(i, i + 2), 16));
  const m = pa.map((v, i) => Math.round(v + (pb[i] - v) * t));
  return `#${m.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

interface Region {
  x: number; // bottom-left of drawn scene in PDF coords
  y: number;
  scale: number; // scene units → PDF points
}

/** Map scene coords (600×800, y-down) into a PDF region. */
function px(r: Region, sx: number) {
  return r.x + sx * r.scale;
}
function py(r: Region, sy: number) {
  return r.y + (SCENE_H - sy) * r.scale;
}

/** Remap generated SVG path data into PDF page coords. */
function remapPath(d: string, r: Region): string {
  return d.replace(/(-?\d+(?:\.\d+)?)[ ,](-?\d+(?:\.\d+)?)/g, (_m, x, y) => {
    return `${px(r, Number(x)).toFixed(1)} ${py(r, Number(y)).toFixed(1)}`;
  });
}

/** Draw the watercolor scene as vector ops. pdf-lib has no gradients → sky as bands. */
function drawScene(page: PDFPage, L: SceneLayout, r: Region) {
  // sky bands 0 → horizon
  const BANDS = 14;
  for (let i = 0; i < BANDS; i++) {
    const y0 = (L.horizon / BANDS) * i;
    const y1 = (L.horizon / BANDS) * (i + 1);
    page.drawRectangle({
      x: px(r, 0),
      y: py(r, y1),
      width: SCENE_W * r.scale,
      height: (y1 - y0) * r.scale,
      color: hexToRgb(lerpColor(L.palette.skyTop, L.palette.skyBottom, i / (BANDS - 1))),
    });
  }

  // sun + halo
  page.drawCircle({
    x: px(r, L.sunX),
    y: py(r, L.sunY),
    size: L.haloR * r.scale,
    color: hexToRgb(L.palette.sun),
    opacity: 0.18,
  });
  page.drawCircle({
    x: px(r, L.sunX),
    y: py(r, L.sunY),
    size: L.sunR * r.scale,
    color: hexToRgb(L.palette.sun),
    opacity: 0.9,
  });

  // birds
  for (const b of L.birds) {
    page.drawSvgPath(
      remapPath(
        `M ${b.x} ${b.y} q ${6 * b.s} ${-6 * b.s} ${12 * b.s} 0 q ${6 * b.s} ${-6 * b.s} ${12 * b.s} 0`,
        r,
      ),
      { borderColor: hexToRgb("#5c4f3f"), borderWidth: 2 * r.scale, opacity: 0.5 },
    );
  }

  // ground (two overlapping wash bands)
  page.drawSvgPath(
    remapPath(
      `M 0 ${L.horizon} Q ${SCENE_W / 2} ${L.horizon - 24} ${SCENE_W} ${L.horizon} L ${SCENE_W} ${SCENE_H} L 0 ${SCENE_H} Z`,
      r,
    ),
    { color: hexToRgb(L.palette.ground) },
  );
  page.drawSvgPath(
    remapPath(
      `M 0 ${L.horizon + 60} Q ${SCENE_W / 2} ${L.horizon + 40} ${SCENE_W} ${L.horizon + 60} L ${SCENE_W} ${SCENE_H} L 0 ${SCENE_H} Z`,
      r,
    ),
    { color: hexToRgb(L.palette.groundDeep), opacity: 0.55 },
  );

  // grass tufts
  for (const t of L.tufts) {
    const x0 = px(r, t.x);
    const y0 = py(r, t.y);
    const s = t.s * r.scale;
    page.drawLine({ start: { x: x0, y: y0 }, end: { x: x0 - 8 * s, y: y0 + 20 * s }, thickness: 1.2 * s, color: hexToRgb(L.palette.accent), opacity: 0.7 });
    page.drawLine({ start: { x: x0 + 4 * s, y: y0 }, end: { x: x0 + 4 * s, y: y0 + 24 * s }, thickness: 1.2 * s, color: hexToRgb(L.palette.accent), opacity: 0.7 });
    page.drawLine({ start: { x: x0 + 8 * s, y: y0 }, end: { x: x0 + 18 * s, y: y0 + 18 * s }, thickness: 1.2 * s, color: hexToRgb(L.palette.accent), opacity: 0.7 });
  }

  // baobab
  if (L.tree) {
    page.drawSvgPath(remapPath(baobabPath(L.tree.x, L.tree.baseY, L.tree.s), r), {
      color: hexToRgb(L.palette.ink),
      opacity: 0.92,
    });
  }

  // companion bird
  if (L.companion) {
    const c = L.companion;
    page.drawSvgPath(
      remapPath(
        `M ${c.x} ${c.y} Q ${c.x + 8} ${c.y - 10} ${c.x + 16} ${c.y} Q ${c.x + 8} ${c.y + 6} ${c.x} ${c.y} Z M ${c.x + 16} ${c.y} L ${c.x + 24} ${c.y - 3} L ${c.x + 17} ${c.y + 4} Z`,
        r,
      ),
      { color: hexToRgb(L.palette.accent), opacity: 0.85 },
    );
  }

  // hero — simplified consistent figure (same seed → same look as SVG)
  const h = L.hero;
  const hx = px(r, h.x);
  const hy = py(r, h.y);
  const s = h.s * r.scale;
  page.drawEllipse({ x: hx, y: hy + 2 * s, xScale: 18 * s, yScale: 4 * s, color: hexToRgb("#3a2c1c"), opacity: 0.18 });
  page.drawRectangle({ x: hx - 7 * s, y: hy - 26 * s, width: 6 * s, height: 26 * s, color: hexToRgb(h.outfit) });
  page.drawRectangle({ x: hx + 1 * s, y: hy - 26 * s, width: 6 * s, height: 26 * s, color: hexToRgb(h.outfit) });
  page.drawSvgPath(
    `M ${hx - 11 * s} ${hy - 26 * s} Q ${hx} ${hy - 34 * s} ${hx + 11 * s} ${hy - 26 * s} L ${hx + 9 * s} ${hy - 58 * s} Q ${hx} ${hy - 64 * s} ${hx - 9 * s} ${hy - 58 * s} Z`,
    { color: hexToRgb(h.outfit) },
  );
  page.drawLine({ start: { x: hx - 10 * s, y: hy - 56 * s }, end: { x: hx - 14 * s, y: hy - 34 * s }, thickness: 4.5 * s, color: hexToRgb(h.skin), opacity: 0.9 });
  page.drawLine({ start: { x: hx + 10 * s, y: hy - 56 * s }, end: { x: hx + 14 * s, y: hy - 34 * s }, thickness: 4.5 * s, color: hexToRgb(h.skin), opacity: 0.9 });
  page.drawCircle({ x: hx, y: hy - 70 * s, size: 11 * s, color: hexToRgb(h.skin) });
  if (h.hairStyle === "afro") {
    page.drawCircle({ x: hx, y: hy - 73 * s, size: 12.5 * s, color: hexToRgb(h.hair), opacity: 0.9 });
    page.drawCircle({ x: hx, y: hy - 70 * s, size: 11 * s, color: hexToRgb(h.skin) });
  } else {
    page.drawSvgPath(
      `M ${hx - 11 * s} ${hy - 72 * s} Q ${hx} ${hy - 88 * s} ${hx + 11 * s} ${hy - 72 * s} L ${hx + 10 * s} ${hy - 66 * s} Q ${hx} ${hy - 74 * s} ${hx - 10 * s} ${hy - 66 * s} Z`,
      { color: hexToRgb(h.hair) },
    );
  }
  page.drawCircle({ x: hx - 3.5 * s, y: hy - 70 * s, size: 1.1 * s, color: hexToRgb("#2b2118") });
  page.drawCircle({ x: hx + 3.5 * s, y: hy - 70 * s, size: 1.1 * s, color: hexToRgb("#2b2118") });
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

export interface PdfPageInput {
  pageNo: number;
  kind: "cover" | "story" | "illustration_only" | "back";
  title?: string;
  textFr: string | null;
  illustration: IllustrationInput | null;
}

export async function buildBookPdf(pages: PdfPageInput[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  for (const p of pages) {
    const page = doc.addPage([PAGE_W, PAGE_H]);
    page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: hexToRgb(PAPER) });

    if (p.kind === "cover" || p.kind === "back") {
      if (p.illustration) {
        const L = computeSceneLayout(p.illustration);
        // full-bleed crop: scale to page height
        const scale = PAGE_H / SCENE_H;
        drawScene(page, L, { x: (PAGE_W - SCENE_W * scale) / 2, y: 0, scale });
      }
      if (p.title) {
        const size = p.kind === "cover" ? 30 : 24;
        const lines = wrapText(p.title, serifBold, size, PAGE_W - 80);
        const y = p.kind === "cover" ? 96 : PAGE_H - 140;
        lines.forEach((line, i) => {
          page.drawText(line, {
            x: (PAGE_W - serifBold.widthOfTextAtSize(line, size)) / 2,
            y: y - i * (size + 10),
            size,
            font: serifBold,
            color: hexToRgb(PAPER),
          });
        });
      }
      if (p.kind === "back" && p.textFr) {
        const lines = wrapText(p.textFr.replaceAll("\n", " "), serif, 14, PAGE_W - 100);
        lines.forEach((line, i) => {
          page.drawText(line, {
            x: (PAGE_W - serif.widthOfTextAtSize(line, 14)) / 2,
            y: 96 - i * 20,
            size: 14,
            font: serif,
            color: hexToRgb(INK),
          });
        });
      }
    } else {
      // story page: scene in top zone (letterboxed), text below on paper
      const TEXT_ZONE = 230;
      const sceneZoneH = PAGE_H - TEXT_ZONE;
      if (p.illustration) {
        const L = computeSceneLayout(p.illustration);
        const scale = Math.min(PAGE_W / SCENE_W, sceneZoneH / SCENE_H);
        const w = SCENE_W * scale;
        drawScene(page, L, {
          x: (PAGE_W - w) / 2,
          y: TEXT_ZONE + (sceneZoneH - SCENE_H * scale) / 2,
          scale,
        });
      } else {
        page.drawRectangle({
          x: 0,
          y: TEXT_ZONE,
          width: PAGE_W,
          height: sceneZoneH,
          color: hexToRgb("#efe6d3"),
        });
      }

      if (p.textFr) {
        const size = 12.5;
        const step = size * 1.55;
        const lines = wrapText(p.textFr, serif, size, PAGE_W - 72);
        let y = TEXT_ZONE - 24;
        for (const line of lines.slice(0, 9)) {
          page.drawText(line, {
            x: 36,
            y,
            size,
            font: serif,
            color: hexToRgb(INK),
          });
          y -= step;
        }
      }
      page.drawLine({
        start: { x: 36, y: 46 },
        end: { x: PAGE_W - 36, y: 46 },
        thickness: 0.7,
        color: hexToRgb("#e0d4bc"),
      });
      page.drawText(String(p.pageNo), {
        x: PAGE_W / 2 - 4,
        y: 30,
        size: 11,
        font: sans,
        color: hexToRgb("#5c4f3f"),
      });
    }
  }

  return doc.save();
}
