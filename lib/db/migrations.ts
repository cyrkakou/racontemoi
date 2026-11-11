// Hand-maintained DDL mirroring lib/db/schema.ts.
// Bundled into the standalone build → migrations run via /api/admin/migrate
// on the cPanel host where drizzle-kit/node_modules are unavailable.

export const MIGRATIONS: { id: string; sql: string }[] = [
  {
    id: "0001_init",
    sql: `
CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(120) NOT NULL,
  locale VARCHAR(8) NOT NULL DEFAULT 'fr',
  monthly_generation_quota INT NOT NULL DEFAULT 60,
  storage_bytes_used BIGINT NOT NULL DEFAULT 0,
  storage_quota_bytes BIGINT NOT NULL DEFAULT 536870912,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY users_email_uq (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS editorial_collections (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(80) NOT NULL,
  title_fr VARCHAR(160) NOT NULL,
  description_fr TEXT NULL,
  cultural_scope VARCHAR(255) NULL,
  sort_order INT NOT NULL DEFAULT 0,
  status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY collections_slug_uq (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cultural_contexts (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  region VARCHAR(160) NOT NULL,
  tradition_type ENUM('history','inspiration','fiction') NOT NULL,
  summary_fr TEXT NOT NULL,
  sources JSON NULL,
  verified_by VARCHAR(160) NULL,
  verified_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS book_templates (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  slug VARCHAR(120) NOT NULL,
  collection_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  synopsis_fr TEXT NULL,
  cultural_context_id BIGINT UNSIGNED NOT NULL,
  cover_asset_id CHAR(36) NULL,
  editorial_status ENUM('draft','in_review','published','archived') NOT NULL DEFAULT 'draft',
  current_version_id BIGINT UNSIGNED NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY templates_slug_uq (slug),
  KEY templates_collection_idx (collection_id),
  CONSTRAINT fk_templates_collection FOREIGN KEY (collection_id) REFERENCES editorial_collections(id),
  CONSTRAINT fk_templates_context FOREIGN KEY (cultural_context_id) REFERENCES cultural_contexts(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS book_template_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  template_id BIGINT UNSIGNED NOT NULL,
  version INT NOT NULL,
  narrative_schema JSON NULL,
  page_plan JSON NULL,
  version_status ENUM('draft','published','archived') NOT NULL DEFAULT 'draft',
  published_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY template_versions_uq (template_id, version),
  CONSTRAINT fk_tversions_template FOREIGN KEY (template_id) REFERENCES book_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS personalization_schemas (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  template_version_id BIGINT UNSIGNED NOT NULL,
  version INT NOT NULL DEFAULT 1,
  definition JSON NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY personalization_schemas_uq (template_version_id, version),
  CONSTRAINT fk_pschema_version FOREIGN KEY (template_version_id) REFERENCES book_template_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS files (
  id CHAR(36) NOT NULL PRIMARY KEY,
  owner_user_id BIGINT UNSIGNED NULL,
  project_id BIGINT UNSIGNED NULL,
  kind ENUM('cover','character_ref','illustration','pdf','tmp') NOT NULL DEFAULT 'tmp',
  storage_key VARCHAR(255) NOT NULL,
  mime VARCHAR(120) NOT NULL,
  bytes BIGINT NOT NULL DEFAULT 0,
  sha256 CHAR(64) NULL,
  expires_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE KEY files_storage_key_uq (storage_key),
  KEY files_owner_idx (owner_user_id),
  KEY files_project_idx (project_id),
  CONSTRAINT fk_files_owner FOREIGN KEY (owner_user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS projects (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  template_id BIGINT UNSIGNED NOT NULL,
  template_version_id BIGINT UNSIGNED NOT NULL,
  title VARCHAR(200) NOT NULL,
  status ENUM('draft','narrative_ready','illustrating','ready','exported','deleted') NOT NULL DEFAULT 'draft',
  personalization JSON NULL,
  approved_story_version_id BIGINT UNSIGNED NULL,
  character_version INT NOT NULL DEFAULT 1,
  deleted_at DATETIME(3) NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY projects_user_status_idx (user_id, status),
  KEY projects_template_idx (template_id),
  CONSTRAINT fk_projects_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_projects_template FOREIGN KEY (template_id) REFERENCES book_templates(id),
  CONSTRAINT fk_projects_tversion FOREIGN KEY (template_version_id) REFERENCES book_template_versions(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS project_characters (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  role ENUM('hero','companion','narrator') NOT NULL,
  name VARCHAR(120) NOT NULL,
  age_band VARCHAR(8) NULL,
  description TEXT NOT NULL,
  style_tokens JSON NULL,
  bible_version INT NOT NULL DEFAULT 1,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY project_characters_uq (project_id, role, bible_version),
  CONSTRAINT fk_pchar_project FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS character_references (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  character_id BIGINT UNSIGNED NOT NULL,
  asset_id CHAR(36) NULL,
  kind ENUM('description','reference_image','style_sheet') NOT NULL DEFAULT 'description',
  approved BOOLEAN NOT NULL DEFAULT FALSE,
  notes TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY character_refs_char_idx (character_id),
  CONSTRAINT fk_crefs_char FOREIGN KEY (character_id) REFERENCES project_characters(id),
  CONSTRAINT fk_crefs_asset FOREIGN KEY (asset_id) REFERENCES files(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS story_versions (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  version INT NOT NULL,
  source ENUM('deterministic','ai','edited') NOT NULL,
  provider VARCHAR(60) NULL,
  prompt_version VARCHAR(40) NULL,
  content JSON NOT NULL,
  status ENUM('pending','ready','approved','superseded') NOT NULL DEFAULT 'pending',
  created_by_user BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY story_versions_uq (project_id, version),
  KEY story_versions_project_idx (project_id),
  CONSTRAINT fk_story_project FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS book_pages (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  page_no INT NOT NULL,
  kind ENUM('cover','story','illustration_only','back') NOT NULL DEFAULT 'story',
  current_asset_id CHAR(36) NULL,
  approved_asset_id CHAR(36) NULL,
  text_override TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY book_pages_uq (project_id, page_no),
  KEY book_pages_project_idx (project_id),
  CONSTRAINT fk_bpages_project FOREIGN KEY (project_id) REFERENCES projects(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS illustration_assets (
  id CHAR(36) NOT NULL PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  page_id BIGINT UNSIGNED NOT NULL,
  character_version INT NOT NULL DEFAULT 1,
  prompt JSON NULL,
  provider VARCHAR(60) NULL,
  provider_job_id VARCHAR(120) NULL,
  status ENUM('pending','generating','ready','approved','superseded','failed') NOT NULL DEFAULT 'pending',
  file_id CHAR(36) NULL,
  cost_cents INT NOT NULL DEFAULT 0,
  error TEXT NULL,
  seed INT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY illustration_assets_project_page_idx (project_id, page_id),
  KEY illustration_assets_status_idx (status),
  KEY illustration_assets_provider_job_idx (provider_job_id),
  CONSTRAINT fk_iassets_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_iassets_page FOREIGN KEY (page_id) REFERENCES book_pages(id),
  CONSTRAINT fk_iassets_file FOREIGN KEY (file_id) REFERENCES files(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generation_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  type ENUM('narrative','illustration_batch','page_illustration','pdf_export') NOT NULL,
  project_id BIGINT UNSIGNED NULL,
  payload JSON NOT NULL,
  status ENUM('pending','claimed','processing','completed','failed') NOT NULL DEFAULT 'pending',
  priority INT NOT NULL DEFAULT 100,
  run_after DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  lease_owner CHAR(36) NULL,
  lease_expires_at DATETIME(3) NULL,
  attempts INT NOT NULL DEFAULT 0,
  max_attempts INT NOT NULL DEFAULT 5,
  idempotency_key CHAR(64) NOT NULL,
  progress JSON NULL,
  last_error TEXT NULL,
  cost_cents INT NOT NULL DEFAULT 0,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY generation_jobs_idem_uq (idempotency_key),
  KEY generation_jobs_claim_idx (status, run_after, lease_expires_at),
  KEY generation_jobs_project_idx (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS generation_costs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT UNSIGNED NOT NULL,
  project_id BIGINT UNSIGNED NULL,
  job_id BIGINT UNSIGNED NULL,
  provider VARCHAR(60) NOT NULL,
  kind ENUM('text','image','pdf') NOT NULL,
  units INT NOT NULL DEFAULT 1,
  unit_cost_cents INT NOT NULL DEFAULT 0,
  total_cents INT NOT NULL DEFAULT 0,
  metadata JSON NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  KEY generation_costs_user_idx (user_id, created_at),
  KEY generation_costs_project_idx (project_id),
  CONSTRAINT fk_gcosts_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS export_jobs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  project_id BIGINT UNSIGNED NOT NULL,
  story_version_id BIGINT UNSIGNED NULL,
  status ENUM('pending','processing','ready','failed') NOT NULL DEFAULT 'pending',
  file_id CHAR(36) NULL,
  pages_rendered INT NOT NULL DEFAULT 0,
  error TEXT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  KEY export_jobs_project_idx (project_id),
  CONSTRAINT fk_exports_project FOREIGN KEY (project_id) REFERENCES projects(id),
  CONSTRAINT fk_exports_file FOREIGN KEY (file_id) REFERENCES files(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`,
  },
];
