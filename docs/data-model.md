# Data model — MySQL/MariaDB + Drizzle

**Date:** 2026-11-11 · Engine: MariaDB 11.4 · Charset `utf8mb4` · Collation `utf8mb4_unicode_ci`

All tables InnoDB, FK constraints enforced, `created_at`/`updated_at` `DATETIME(3)` default
`CURRENT_TIMESTAMP(3)`. IDs = `BIGINT UNSIGNED AUTO_INCREMENT` except join/asset tables using
`CHAR(36)` UUID where exposed externally.

## Entity map (directive §7 → tables)

| Directive entity | Table | Notes |
|---|---|---|
| Users | `users` | id, email UNIQUE, password_hash, name, locale default 'fr', quota fields, timestamps |
| EditorialCollections | `editorial_collections` | slug UNIQUE, title_fr, description, sort_order, status |
| BookTemplates | `book_templates` | slug UNIQUE (= pilot book), collection_id FK, title, synopsis, cultural_context_id FK, editorial_status ENUM(draft,in_review,published,archived), current_version_id |
| BookTemplateVersions | `book_template_versions` | template_id FK, version INT, narrative_schema JSON, page_plan JSON (12 page specs), status, published_at |
| CulturalContexts | `cultural_contexts` | region, tradition_type ENUM(history,inspiration,fiction), summary_fr, sources JSON, verified_by, verified_at |
| PersonalizationSchemas | `personalization_schemas` | template_version_id FK, schema JSON (fields, options, constraints), version |
| Projects | `projects` | user_id FK, template_id FK, template_version_id FK, title, status ENUM(draft,narrative_ready,illustrating,ready,exported,deleted), personalization JSON, approved_story_version_id, character_version INT, timestamps, deleted_at |
| ProjectCharacters | `project_characters` | project_id FK, role ENUM(hero,companion,narrator), name, age_band, description, style_tokens JSON, bible_version INT, UNIQUE(project_id, role, bible_version) |
| CharacterReferences | `character_references` | character_id FK, asset_id FK→files, kind ENUM(description,reference_image,style_sheet), approved BOOL, notes |
| StoryVersions | `story_versions` | project_id FK, version INT, source ENUM(deterministic,ai,edited), provider, prompt_version, content JSON (pages[] with text_fr), status ENUM(pending,ready,approved,superseded), created_by_user BOOL |
| BookPages | `book_pages` | project_id FK, page_no 1..12, kind ENUM(cover,story,illustration_only,back), UNIQUE(project_id,page_no), current_asset_id, approved_asset_id, text_override TEXT NULL |
| IllustrationAssets | `illustration_assets` | id CHAR(36) UUID, project_id FK, page_id FK, character_version INT, prompt JSON, provider, provider_job_id, status ENUM(pending,generating,ready,approved,superseded,failed), file_id FK→files, cost_cents INT, error TEXT, seed INT |
| GenerationJobs | `generation_jobs` | type ENUM(narrative,illustration_batch,page_illustration,pdf_export), payload JSON, status ENUM(pending,claimed,processing,completed,failed), priority INT, run_after DATETIME(3), lease_owner CHAR(36), lease_expires_at, attempts INT, max_attempts INT, idempotency_key CHAR(64) UNIQUE, progress JSON, last_error TEXT, cost_cents INT |
| GenerationCosts | `generation_costs` | user_id FK, project_id FK NULL, job_id FK NULL, provider, kind ENUM(text,image,pdf), units INT, unit_cost_cents INT, total_cents INT, metadata JSON, created_at |
| ExportJobs | `export_jobs` | project_id FK, story_version_id FK, status ENUM(pending,processing,ready,failed), file_id FK→files, pages_rendered INT, error TEXT |
| Files | `files` | id CHAR(36) UUID, owner_user_id FK NULL, project_id FK NULL, kind ENUM(cover,character_ref,illustration,pdf,tmp), storage_key VARCHAR(255) UNIQUE, mime, bytes BIGINT, sha256 CHAR(64), created_at, expires_at NULL |

## Key indexes

- `projects(user_id, status)`, `projects(template_id)`
- `story_versions(project_id, version)` UNIQUE(project_id, version)
- `book_pages(project_id, page_no)` UNIQUE
- `illustration_assets(project_id, page_id, status)`, `(provider_job_id)`
- `generation_jobs(status, run_after, lease_expires_at)` — the worker's hot path
- `generation_jobs(idempotency_key)` UNIQUE
- `files(owner_user_id)`, `files(project_id)`
- `generation_costs(user_id, created_at)`, `(project_id)`

## Integrity rules

- Approved content is immutable: `story_versions.status='approved'` rows are never UPDATEd;
  edits create `source='edited'` versions. Same for `illustration_assets` — regeneration inserts
  a new row; `approved_asset_id` on `book_pages` only moves by explicit user action.
- `projects.deleted_at` soft-delete for 30 days, then hard purge job removes rows + files.
- Every job carries `idempotency_key` = hash(type + payload canonical JSON); duplicate enqueue
  returns the existing job.
- Transactions: project creation (project+characters+pages), story approval (version status +
  project pointer), illustration approval (asset status + page pointer) — each in one transaction.

## Migrations & ops

- `drizzle-kit generate` → SQL files in `drizzle/`; `scripts/migrate.mjs` applies them idempotently
  (track in `__drizzle_migrations`).
- `scripts/seed.mjs` inserts collections, cultural context, template + v1, personalization schema.
- Backup: cPanel backup or nightly `mysqldump` cron → `~/private/backups/` (documented, 7-day rotation).
- No second database; no SQLite fallback.
