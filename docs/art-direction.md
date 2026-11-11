# Art direction — Racontemoi

**Date:** 2026-11-11 · Governs all visual output: UI, covers, illustrations, PDF.

## 1. Illustration style — "l'aquarelle d'atelier"

Hand-painted watercolor storybook plates with:

- **Medium:** gouache/watercolor on textured paper; visible brush texture, soft edges, granulation.
- **Line:** minimal or absent; forms defined by color washes and light. Optional soft ink contour
  for character faces to keep expressions readable for young children.
- **Palette per book:** locked palette derived from the cultural context (savanna: ochre, sienna,
  dusty teal, bone; forest: botanical greens, amber; coast: sand, coral, indigo).
- **Light:** warm late-afternoon sun — long soft shadows, golden rim light. Never flat daylight.
- **Composition:** editorial plate rules — generous negative space, one focal action per spread,
  characters small enough to feel observed, not posed for camera.
- **Character consistency:** same character sheet reference for every page of a book (see
  `docs/ai-orchestration.md` §3). Proportions locked: child hero ~1/3 frame height.

Reference adjectives: *Tomi Ungerer meets Barbara Cooney meets Quentin Blake restraint.*
NOT: Disney gloss, anime, photorealism, corporate flat illustration.

## 2. Cover system

- Portrait 3:4 ratio (PDF/reader) + 1:1 social crop.
- Composition: title set in display serif, small press-mark (baobab glyph), illustration vignette
  bottom third — never a full-bleed character (keeps personalization reveal magical).
- Per-template cover template + hero-name variant generated at personalization time.

## 3. Photography & imagery policy

- No stock photography of African people/children (authenticity + dignity risk).
- UI imagery = the product itself: book covers, page spreads, texture swatches.
- Paper texture: subtle SVG-generated grain (feTurbulence) — no heavy image assets.

## 4. Iconography

- Custom thin-line SVG icon set (Lucide-derived, 1.5px stroke, rounded caps) — one family only.
- No emoji in UI. No icon fonts.

## 5. Motion language

- **Page turn:** physical metaphor — spread lifts from right edge with soft shadow, ~450 ms,
  `cubic-bezier(.2,.7,.2,1)`; under `prefers-reduced-motion` → instant cut.
- **Studio reveals:** content settles (fade + 8px rise, 300 ms, stagger ≤50 ms between siblings).
- **Generation states:** illustrated progress — a small "atelier" indicator (brush-dry texture
  filling), not a spinner cliché. Text states in French: « L'illustrateur travaille… ».
- Never animate for decoration alone; motion answers an action or marks progress.

## 6. Texture & material

- Paper: `#F7F1E5` base + grain overlay at 3–4% opacity.
- Ink: `#2B2118` warm black (never `#000`).
- Hairlines: `#E3D9C4` borders, 1px, used structurally (editorial rules) not decoratively.
- Depth: no generic drop shadows — use paper layering (1–2px offset, `rgba(43,33,24,.08)`) and
  soft ambient occlusion only on the book object itself.

## 7. Cultural imagery rules (directive §12 applied visually)

- Motifs must be sourced from the story's declared `cultural_context` — e.g., baobab, kente
  geometry, mud-cloth texture, griot instruments — each with documented origin in
  `editorial-catalog.md`.
- No pan-African mashups: no Maasai beads + kente + djembe in one image unless the narrative
  justifies it (documented in the template's cultural context).
- People in illustrations: fictional characters, stylized, never caricatured; skin tones vary
  naturally within the region's palette.
