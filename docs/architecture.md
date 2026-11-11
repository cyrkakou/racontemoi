# Architecture — Racontemoi

**Date:** 2026-11-11 · **Stack proven on target host:** see `docs/hosting-feasibility.md`

## 1. System overview

```
Browser (French UI)
   │ HTTPS
   ▼
Next.js 16 App Router — standalone build
   ├── RSC pages: marketing, catalog, studio, reader, account
   ├── Route Handlers: /api/* (auth, projects, generation triggers, files, jobs status)
   └── Server services (lib/services/*): validation, ownership, orchestration
        │
        ├── MySQL/MariaDB (Drizzle ORM, mysql2 pool ≤3)
        │     ├── domain tables (users, stories, projects, pages…)
        │     ├── generation_jobs  ← queue of record
        │     └── generation_costs ← ledger
        │
        └── ~/private/storybook/   ← StorageProvider (covers, refs, illustrations, PDFs)
              │
              ▼
cPanel cron (every minute) → node scripts/run-jobs.mjs
   claims ≤N jobs atomically, executes bounded provider calls,
   writes results to DB + storage, checkpoints progress
```

## 2. Key decisions and trade-offs

### D1 — Next.js stays; no fallback needed
Phase 0 proved standalone + Passenger works. Fallback (PHP API) rejected: would double the stack
for zero hosting gain. **Trade-off accepted:** bounded requests only; all heavy work is jobs.

### D2 — Job queue in MySQL, not Redis/queue lib
Directive constraint (no Redis). `generation_jobs` table + `FOR UPDATE`-style atomic claim:

```sql
UPDATE generation_jobs
SET status='CLAIMED', lease_owner=?, lease_expires_at=?, attempts=attempts+1
WHERE id = (SELECT id FROM generation_jobs
            WHERE status='PENDING' AND run_after<=NOW()
            ORDER BY priority, id LIMIT 1) AND status='PENDING';
```

Lease expiry → recovery sweep marks `CLAIMED/PROCESSING` with expired lease back to `PENDING`
(or `FAILED` after max attempts). Cron script exits after batch budget — never a daemon.

### D3 — Auth.js v5 (next-auth) with Drizzle adapter + JWT sessions
Compatible: Node runtime, no Edge dependency for credentials flow. bcryptjs (pure JS) for passwords.
Session = JWT cookie → stateless, works across Passenger workers. User↔project ownership checked
in service layer on every query (`WHERE project_id=? AND user_id=?`).

### D4 — Provider-agnostic AI adapters
`lib/ai/types.ts` defines `TextProvider.generateNarrative(input)`, `ImageProvider.generateScene(input)`.
Implementations: `DemoTextProvider`/`DemoImageProvider` (deterministic, seeded — the default)
and `LiveTextProvider`/`LiveImageProvider` (HTTP adapters to chosen vendor, added when keys exist).
Mode resolved once per job from `AI_PROVIDER` env — jobs record which provider ran (`provider`,
`provider_job_id`, cost).

### D5 — Character consistency = data, not prompt hope
`project_characters` + `character_references` store the bible: canonical description, style tokens,
approved reference asset IDs, per-character seed/params. Live image adapter supports reference-image
input where the vendor allows; demo mode composites a deterministic SVG "character sheet" so identity
is *visibly* consistent without any API. Page prompts = `style_prefix + character_bible + scene_beats`;
the bible is versioned (`character_version`) so approved pages never silently change.

### D6 — Storage: private FS behind auth
Extend `lib/storage.ts` into `LocalStorageProvider`: root `PERSISTENT_STORAGE_DIR`, files named
`<random-uuid>.<ext>`, metadata rows in `illustration_assets`/`export_jobs` link file→owner.
Downloads only via `/api/files/[assetId]` which checks session + ownership, streams with
`Content-Disposition`. Quota: per-user byte cap enforced at upload/generation time.

### D7 — PDF: pdf-lib (pure JS)
No native deps. Layout = fixed 12-page spread template (cover, story spreads, colophon).
Images embedded as JPEG/PNG bytes already stored; text via embedded OFL fonts (subset not required
at MVP sizes). Runs inside an `export_jobs` job — never in a request.

### D8 — i18n: French-first dictionary
UI strings in `lib/i18n/fr.ts` (+ `en.ts` stub). No next-intl dependency for MVP; pattern keeps
locale switch cheap later. Dates/numbers via `Intl` `fr-FR`.

### D9 — Frontend: Tailwind + shadcn-style primitives + Motion
Tailwind CSS (new dep), a small set of owned primitives in `components/ui` (button, input, card,
dialog, badge, tabs) styled to the design system — not the full shadcn CLI. `motion` (framer-motion
 successor) for reader page-turn + studio reveals, all gated behind `prefers-reduced-motion`.
Fonts via `next/font/google`: Fraunces, Newsreader, Instrument Sans (self-hosted at build → no
runtime Google dependency, GDPR-friendly).

## 3. Module map

```
app/
  (marketing)/page.tsx, /histoires, /histoires/[slug]
  (auth)/connexion, /inscription
  (app)/creer/[templateId]/**        studio flow
  (app)/projets/[id]/reader          interactive reader
  (app)/projets/[id]/exporter        PDF export
  (app)/compte                       projects, settings, delete
  api/
    auth/[...nextauth]               Auth.js
    projects/**                      CRUD + ownership
    projects/[id]/generate/**        enqueue narrative/illustration jobs
    projects/[id]/pages/[n]          page edit/approve/regenerate
    files/[assetId]                  authorized download
    jobs/[id]                        status poll (short)
    health/*                         existing probes + jobs probe
lib/
  db/ (drizzle client + schema/*)
  auth.ts (extended: session helpers, ownership guards)
  services/ (projects, narrative, illustrations, exports, quotas)
  ai/ (types + demo + live adapters)
  storage.ts (StorageProvider)
  i18n/
scripts/
  run-jobs.mjs                       cron entrypoint
  migrate.mjs                        apply drizzle migrations
  seed.mjs                           editorial content seed
```

## 4. Request lifecycle examples

**Generate narrative (demo):** POST `/api/projects/[id]/generate/story` → validate ownership + quota
→ insert `story_versions(status=PENDING)` + `generation_jobs(type=NARRATIVE)` → 202 `{jobId}` →
client polls `/api/jobs/[id]` → cron claims job → DemoTextProvider renders deterministic text →
`story_versions` updated, job COMPLETED. User sees "prêt" in ≤ cron interval + render time.

**Regenerate one illustration:** POST `.../pages/[n]/regenerate` → new `illustration_assets` row
(status GENERATING) + job; previous asset kept (`superseded_by`) until new one approved → approved
pages never overwritten.

**Export PDF:** POST `.../export` → `export_jobs` + job → pdf-lib composes from approved assets →
file in `~/private/.../exports/` → download via `/api/files/[assetId]`.

## 5. Failure & recovery model

- Job kill mid-flight: lease expires (default 120 s) → sweep returns it to PENDING, `attempts+1`.
- Provider timeout: adapter-level timeout (30 s text / 120 s image), retry w/ exponential backoff
  (`run_after = now + 2^attempts * 30s`, max 5 attempts → FAILED with `last_error` shown to user).
- DB down: route handlers return sanitized 503 (existing pattern); cron exits non-zero, next tick retries.
- Disk full: storage writes fail → job FAILED with clear error; alert via health endpoint.

## 6. What we deliberately do NOT build

- WebSockets/SSE, Redis, queues-as-a-service, Docker, native image libs, monorepo tooling,
  feature flags service, analytics SDK, CMS UI (seed scripts suffice for pilot).
