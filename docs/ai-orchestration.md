# AI orchestration — editorial-first, cost-controlled

**Date:** 2026-11-11 · **Principle:** the catalog is editorial; AI adapts, never invents the foundation.

## 1. Provider abstraction

```
lib/ai/
  types.ts            TextProvider / ImageProvider interfaces + DTOs
  demo-text.ts        deterministic renderer (default, $0)
  demo-image.ts       deterministic SVG compositor (default, $0)
  live-text.ts        HTTP adapter (vendor TBD at key time)
  live-image.ts       HTTP adapter (vendor TBD at key time)
  prompts/            versioned prompt templates (prompt_version tracked)
  budget.ts           quota + cost checks before enqueue
```

`AI_PROVIDER=demo` (default) | `live`. Mode is **per job**, recorded on the job row — a project can
mix demo illustrations with a live narrative and vice versa. UI badges any non-live artifact « Démo ».

## 2. Narrative pipeline

```
BookTemplateVersion.narrative_schema  (approved beats, page plan, invariants)
        + PersonalizationSchemas       (allowed personalization points)
        + project.personalization      (user choices)
        + story tone by age_band       (vocabulary depth, sentence length, theme handling)
                │
   ┌────────────┴────────────┐
   ▼                         ▼
Deterministic renderer   AI variant job
(fill slots, vary        (prompt = schema + invariants +
by age_band; instant)     choices; output validated against
                          schema before storing)
                │
                ▼
story_versions row (content JSON: pages[{no, kind, text_fr, illustration_prompt_hint}])
                │
                ▼ parent approves one version ──► project.approved_story_version_id
```

**Invariant enforcement:** AI output is validated server-side — page count = 12, required beats
present, no personalization drift (hero name must appear where schema requires), length bounds per
age band, forbidden-content screen. Failure → job FAILED with reason; deterministic version remains.

## 3. Illustration pipeline (character consistency)

Per project, `project_characters` rows form the **Character Bible**:

- `description` — canonical physical + personality description (seeded from template, localized with hero name/age)
- `style_tokens` — `{medium:"hand-painted watercolor", palette:[...], line:"soft ink", texture:"paper grain"}`
- `bible_version` — bumps when identity-defining fields change; approved assets keep their version
- `character_references` — approved images/descriptions used as visual anchors

Scene prompt assembly (versioned, stored on the asset row):

```
STYLE_PREFIX (medium, palette, composition rules)
+ CHARACTER_BIBLE (identity block, bible_version)
+ SCENE_BEATS (from story_versions page content + illustration_prompt_hint)
+ PAGE_ASPECT + seed
```

Rules:
- Identity fields live ONLY in the bible block; scene prompts never re-describe the hero.
- Page regeneration creates a new asset row; `book_pages.approved_asset_id` unchanged until user approves.
- Demo mode: deterministic SVG scene compositor — hero rendered as a consistent branded mark
  (silhouette + palette + accessories from bible) so identity is *visibly* stable across pages.
- Live mode capability flag `supports_reference_images`: when true, approved reference assets are
  attached to the image call; when false, bible text + fixed seed/params are used and the UI warns
  that consistency is best-effort.

## 4. Cost control (directive §10)

| Control | Mechanism |
|---|---|
| Budgets | `AI_BUDGET_MONTHLY_CENTS` env cap; `budget.ts` sums `generation_costs` per calendar month, blocks enqueue over cap |
| Per-user quota | `users.monthly_generation_quota` + counter; demo jobs don't consume paid quota |
| Image limits | Max regenerations per page (e.g., 3) tracked on asset rows; further attempts require explicit confirm flag |
| Reuse | Template-level approved assets cached by `prompt_hash`; identical requests reuse file |
| Versioning | `prompt_version` on every asset; prompt changes never silently alter approved pages |
| Confirmation | Live-mode endpoints return `402 cost_estimate` unless `confirm_cost=true`; UI shows estimate first |
| Failure handling | Provider errors → retry/backoff; after max attempts job FAILED, no charge recorded unless provider confirms usage |

## 5. Cron job runner contract

`scripts/run-jobs.mjs` (every minute via cPanel cron):

```
node scripts/run-jobs.mjs --batch 4 --budget-ms 50000
```

- Opens short-lived mysql2 pool (limit 2), claims ≤4 jobs atomically, lease 120 s.
- Per job: load payload → resolve provider by `provider` field → execute with timeout
  (text 30 s, image 120 s, pdf 240 s) → write result + cost row → COMPLETED/FAILED.
- Checkpoints `progress` JSON after each sub-step (e.g., `pages_done: 7/12`) so a killed job
  resumes or cleanly retries idempotently.
- Exit code non-zero on unexpected failure (cron mails via MAILTO if configured).

## 6. Provider selection (to confirm before live mode)

Candidates evaluated on: cost/image, reference-image support, API simplicity, no GPU lock-in.
Decision deferred to Phase 4 with a spike; adapters isolate the choice. Text: any OpenAI-compatible
chat endpoint. Image: vendor with edit/reference endpoint preferred (e.g., Gemini image / OpenAI
gpt-image class) — final pick documented in `docs/ai-orchestration.md` addendum.

## 7. Demo mode fidelity

Demo providers are NOT lorem ipsum: deterministic seeded generators produce real structured
narrative (slot-filled, age-band-aware) and real composed SVG illustrations stored as assets.
Every downstream feature — versions, approval, reader, PDF — runs identically. The only difference
is the « Démo » badge and zero cost. This satisfies directive §14.
