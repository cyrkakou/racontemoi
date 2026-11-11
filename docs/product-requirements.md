# Product requirements — Racontemoi

**Version:** 0.1 (MVP) · **Date:** 2026-11-11 · **Language:** French UI (default), docs in English

## 1. Product statement

Racontemoi is a French-language personalized children's storybook service. A parent picks an
editorially approved African story, personalizes the hero (name, age, appearance cues), reviews a
narrative adapted deterministically + AI-assisted, approves illustrations generated with a persistent
character bible, reads the book interactively, and exports a digital PDF.

One sentence: **« Le conte que vous avez aimé, raconté avec votre enfant dedans. »**

## 2. Actors

| Actor | Description | Primary jobs |
|---|---|---|
| Parent / guardian | Account holder, payer (future), privacy decision-maker | Create account, pick story, personalize, approve narrative + illustrations, export PDF, delete project |
| Child | End reader, never a direct user | Read the finished book; minimal data collected about them |
| Editor (future role) | Content curator | Approve story versions, cultural validation, catalog publishing |

## 3. Functional requirements (MVP)

### FR-A — Accounts & privacy
- FR-A1 Email + password registration/login (Auth.js credentials, bcrypt). No social login in MVP.
- FR-A2 Session cookie, secure + httpOnly + sameSite=lax.
- FR-A3 Project ownership enforced server-side on every read/write.
- FR-A4 Project deletion with cascade + file cleanup (data retention control).
- FR-A5 Minimal child data: hero first name + optional age band + optional appearance notes; no photos required in MVP (reference image upload is Phase-2 capability behind flag).

### FR-B — Catalog
- FR-B1 Public catalog of published stories grouped by collection.
- FR-B2 Story detail page: synopsis, cultural context note, sample pages, price/CTA (MVP: free/demo).
- FR-B3 Only stories with `editorial_status = published` are orderable.

### FR-C — Personalization studio
- FR-C1 Hero form: name, age band (3–5 / 6–8 / 9–12), optional traits (hair, skin tone description, outfit hint) — free text bounded, Zod-validated.
- FR-C2 Story customization: pick approved variant points (e.g., moral emphasis, companion character on/off, setting detail) from the story's personalization schema — never free-form prompt injection into approved narrative.
- FR-C3 Live preview of personalization summary before generation.

### FR-D — Narrative generation
- FR-D1 Deterministic renderer produces the baseline personalized text from template + schema (zero cost, instant).
- FR-D2 "Regenerate with AI" produces an AI-assisted variant via job queue; deterministic version remains the fallback and the default.
- FR-D3 Story versioning: every generation stored; parent can compare and approve one version (`approved_story_version_id`).
- FR-D4 Editing: parent can edit approved text page-by-page (draft state) before illustration generation.

### FR-E — Illustration pipeline
- FR-E1 Character bible auto-created per project: stable description, style tokens, approved reference slots.
- FR-E2 Per-page illustration jobs, individually retryable/regenerable without touching approved pages.
- FR-E3 Demo mode: deterministic placeholder artwork (branded SVG compositions seeded per page) so the full flow works with zero API keys.
- FR-E4 Live mode: image provider adapter; explicit user action + cost confirmation before any paid call.
- FR-E5 Illustration states per page: pending / generating / ready / approved / failed.

### FR-F — Reader & export
- FR-F1 Interactive book reader: page-flip/spread view, swipe on mobile, progress memory.
- FR-F2 PDF export job → private file → authenticated download. Digital-only (print-ready = later).
- FR-F3 Export history per project.

### FR-G — Jobs, costs, ops
- FR-G1 MySQL job queue with cron runner (`PENDING→CLAIMED→PROCESSING→COMPLETED/FAILED`), leases, retries, backoff, idempotency keys.
- FR-G2 Per-user generation quota + per-project cost ledger (`generation_costs`).
- FR-G3 Demo/live mode flag (`AI_PROVIDER=demo|live`) — demo is fully functional, clearly badged "Démo".
- FR-G4 Health endpoints preserved; new `/api/health/jobs` diagnostic.

## 4. Non-functional requirements

- **Performance:** catalog page < 3 s TTFB on shared hosting; reader pages are static-ish; no client bundle > ~250 KB initial.
- **Accessibility:** WCAG 2.2 AA — contrast 4.5:1, keyboard-navigable reader, focus visible, `prefers-reduced-motion` respected.
- **Security:** Zod validation on all inputs; parameterized queries via Drizzle; private assets behind auth route; upload validation (MIME sniff + size cap); rate limits on auth + generation endpoints; no secrets client-side.
- **Privacy (children):** data minimization; parent consent implied by account; no behavioral tracking; project deletion real.
- **i18n:** French UI strings externalized from day one; no hard-coded copy in components.
- **Cost:** $0 recurring infra; AI spend only on explicit user-triggered live generations; demo mode default.

## 5. Explicitly out of MVP

- Payments/billing (free during pilot)
- Multi-child books, gifting flow
- Print-on-demand
- Reference photo upload for character likeness (schema reserved, UI hidden)
- Multi-language books (French only; architecture must not preclude EN later)
- Social features, sharing links
- Native mobile app

## 6. Success criteria for MVP

1. A parent can go homepage → pilot book → personalized 12-page book → PDF, entirely in demo mode, in one sitting.
2. Same flow works in live mode when `AI_PROVIDER=live` + keys present.
3. Zero data loss across Passenger restarts (all state in MySQL/`~/private`).
4. Story/illustration regeneration never destroys approved content.
5. Cost per demo book = $0; live book cost visible in `generation_costs` before confirmation.
