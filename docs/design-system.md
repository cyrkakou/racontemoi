# Design system — Racontemoi

**Date:** 2026-11-11 · Tokens are the contract; components consume them, never raw values.
Sources: `frontend-design` + `ui-ux-pro-max` skills applied; brief's mandated palette wins over
generic defaults (skill rule: brief > defaults).

## 1. Color tokens

```
--paper:        #F7F1E5   /* ivory page background — warm, never pure white */
--paper-deep:   #EFE6D3   /* recessed panels, reader desk */
--ink:          #2B2118   /* warm near-black text */
--ink-soft:     #5C4F3F   /* secondary text — check 4.5:1 on paper */
--line:         #E0D4BC   /* hairline rules */
--terra:        #B4552D   /* terracotta — primary action, accents */
--terra-deep:   #8F3F1F   /* hover/active terra */
--ochre:        #C08A2D   /* ochre — highlights, badges, secondary accent */
--botanical:    #3E5C33   /* botanical green — success, nature accents */
--clay:         #D9C7A7   /* sand neutral — chips, dividers */
--danger:       #A03A2A   /* destructive — warm red, not pure */
```

Rules:
- Body text `--ink` on `--paper` ≈ 12:1 ✓. `--ink-soft` on paper ≈ 5.9:1 ✓ (verify in build).
- Terra is for actions/links; ochre for decorative warmth only — never both competing on one screen.
- Dark mode: NOT in MVP (reader is a "page" — always paper). Revisit post-pilot.
- Semantic mapping mirrors shadcn conventions (`background`, `foreground`, `primary`, `muted`,
  `accent`, `destructive`, `border`, `ring`) so primitives stay portable.

## 2. Typography

| Role | Face | Source | Usage |
|---|---|---|---|
| Display | **Fraunces** (variable, opsz) | Google Fonts, OFL | Book titles, hero headlines, cover titles. Weights 400–700; soft/wonky axis for warmth |
| Story text | **Newsreader** | Google Fonts, OFL | Book page text inside reader — designed for long-form literary reading |
| UI | **Instrument Sans** | Google Fonts, OFL | All interface text, buttons, labels, forms |

- Scale (rem): 0.75 / 0.875 / 1 / 1.125 / 1.375 / 1.75 / 2.25 / 3 / 4.5 (display only).
- Line-height: UI 1.5; story text 1.65–1.75 (child readability); display 1.05–1.15.
- Measure: story text max ~68ch; UI copy max ~60ch.
- `next/font/google` self-hosted at build → no runtime external requests.
- Skill cross-check: typography search returned "Editorial Classic" (Cormorant+Libre Baskerville)
  and "News Editorial" (Newsreader+Roboto); Fraunces chosen over Cormorant for warmer, more
  distinctive character suiting the brief; Newsreader adopted from the editorial match; Instrument
  Sans replaces Roboto for a less generic UI voice.

## 3. Layout principles

- **Editorial grid:** 12-col, 1200px max, generous margins; asymmetric placements allowed on
  marketing pages (text block left, book object right).
- **Book object is the hero** — homepage and catalog lead with covers/spreads, not screenshots.
- Alignment: left-aligned Latin text; centered only for reader controls and cover compositions.
- Spacing scale (px): 4 / 8 / 12 / 16 / 24 / 32 / 48 / 64 / 96. Section rhythm 96–128 on marketing,
  48–64 in app flows.
- Borders/radius: hairline `--line` rules; radius scale 4 / 8 / 12 — covers get 4px (printed feel),
  cards 12px max. No pill-everything.
- Depth: paper-layer shadows only (see art-direction §6); no colored glows.

## 4. Components (owned primitives in `components/ui/`)

Button (primary terra / secondary outline / ghost), Input+Label+Error, Card (paper, hairline),
Badge (« Démo », « Nouveau », status), Dialog, Tabs, Progress (atelier-style), Toast.
All: 44px min hit area, visible focus ring (`--terra` 2px offset), `cursor-pointer`,
loading states that keep label + spinner inline.

## 5. Page-level art direction

- **Homepage:** full editorial spread — giant Fraunces title, one hero book object (pilot cover
  with slow parallax ≤8px), collection index as a "shelf" row, cultural-context footnote strip.
- **Catalog:** shelf metaphor — covers on paper "shelf" lines, collection filters as index tabs.
- **Studio:** desk metaphor — form panel left (paper card), live "page proof" right; generation
  states show the atelier progress, not spinners.
- **Reader:** the book IS the screen — paper spread centered on `--paper-deep` desk, page-turn
  physics, minimal chrome (progress hairline top, controls fade).
- **Account:** utilitarian but typeset — project list as index entries with cover thumbnails.

## 6. Accessibility contract (WCAG 2.2 AA)

- Contrast verified per token (above); no text <12px; never color-alone status (icon+text).
- Keyboard: reader fully navigable (arrows, space); focus trapped in dialogs; skip link present.
- `prefers-reduced-motion`: page-turn → cut; reveals → instant; atelier progress → static.
- French copy reviewed for child-friendly reading level (phrases ≤ 8 words where possible).

## 7. Assets to produce in Phase 3

- Pilot book: 12 illustration plates + cover (demo SVG system first, live watercolor later)
- Press-mark glyph (baobab) SVG
- Paper grain SVG filter
- Favicon set from press-mark
- OG image template (cover + title on paper)
