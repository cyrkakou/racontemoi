import {
  bigint,
  boolean,
  char,
  datetime,
  index,
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const id = () =>
  bigint("id", { mode: "number" }).autoincrement().primaryKey();
const createdAt = () =>
  datetime("created_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);
const updatedAt = () =>
  datetime("updated_at", { mode: "date", fsp: 3 })
    .notNull()
    .default(sql`CURRENT_TIMESTAMP(3)`);

export const users = mysqlTable("users", {
  id: id(),
  email: varchar("email", { length: 255 }).notNull(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  name: varchar("name", { length: 120 }).notNull(),
  locale: varchar("locale", { length: 8 }).notNull().default("fr"),
  monthlyGenerationQuota: int("monthly_generation_quota").notNull().default(60),
  storageBytesUsed: bigint("storage_bytes_used", { mode: "number" })
    .notNull()
    .default(0),
  storageQuotaBytes: bigint("storage_quota_bytes", { mode: "number" })
    .notNull()
    .default(536_870_912), // 512 MiB
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("users_email_uq").on(t.email)]);

export const editorialCollections = mysqlTable("editorial_collections", {
  id: id(),
  slug: varchar("slug", { length: 80 }).notNull(),
  titleFr: varchar("title_fr", { length: 160 }).notNull(),
  descriptionFr: text("description_fr"),
  culturalScope: varchar("cultural_scope", { length: 255 }),
  sortOrder: int("sort_order").notNull().default(0),
  status: mysqlEnum("status", ["draft", "published", "archived"])
    .notNull()
    .default("draft"),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [uniqueIndex("collections_slug_uq").on(t.slug)]);

export const culturalContexts = mysqlTable("cultural_contexts", {
  id: id(),
  region: varchar("region", { length: 160 }).notNull(),
  traditionType: mysqlEnum("tradition_type", [
    "history",
    "inspiration",
    "fiction",
  ]).notNull(),
  summaryFr: text("summary_fr").notNull(),
  sources: json("sources"),
  verifiedBy: varchar("verified_by", { length: 160 }),
  verifiedAt: datetime("verified_at", { mode: "date", fsp: 3 }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
});

export const bookTemplates = mysqlTable("book_templates", {
  id: id(),
  slug: varchar("slug", { length: 120 }).notNull(),
  collectionId: bigint("collection_id", { mode: "number" })
    .notNull()
    .references(() => editorialCollections.id),
  title: varchar("title", { length: 200 }).notNull(),
  synopsisFr: text("synopsis_fr"),
  culturalContextId: bigint("cultural_context_id", { mode: "number" })
    .notNull()
    .references(() => culturalContexts.id),
  coverAssetId: char("cover_asset_id", { length: 36 }),
  editorialStatus: mysqlEnum("editorial_status", [
    "draft",
    "in_review",
    "published",
    "archived",
  ])
    .notNull()
    .default("draft"),
  currentVersionId: bigint("current_version_id", { mode: "number" }),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
}, (t) => [
  uniqueIndex("templates_slug_uq").on(t.slug),
  index("templates_collection_idx").on(t.collectionId),
]);

export const bookTemplateVersions = mysqlTable(
  "book_template_versions",
  {
    id: id(),
    templateId: bigint("template_id", { mode: "number" })
      .notNull()
      .references(() => bookTemplates.id),
    version: int("version").notNull(),
    narrativeSchema: json("narrative_schema"),
    pagePlan: json("page_plan"),
    status: mysqlEnum("version_status", ["draft", "published", "archived"])
      .notNull()
      .default("draft"),
    publishedAt: datetime("published_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("template_versions_uq").on(t.templateId, t.version)],
);

export const personalizationSchemas = mysqlTable(
  "personalization_schemas",
  {
    id: id(),
    templateVersionId: bigint("template_version_id", { mode: "number" })
      .notNull()
      .references(() => bookTemplateVersions.id),
    version: int("version").notNull().default(1),
    definition: json("definition").notNull(),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("personalization_schemas_uq").on(
      t.templateVersionId,
      t.version,
    ),
  ],
);

export const files = mysqlTable(
  "files",
  {
    id: char("id", { length: 36 }).primaryKey(),
    ownerUserId: bigint("owner_user_id", { mode: "number" }).references(
      () => users.id,
    ),
    projectId: bigint("project_id", { mode: "number" }),
    kind: mysqlEnum("kind", [
      "cover",
      "character_ref",
      "illustration",
      "pdf",
      "tmp",
    ])
      .notNull()
      .default("tmp"),
    storageKey: varchar("storage_key", { length: 255 }).notNull(),
    mime: varchar("mime", { length: 120 }).notNull(),
    bytes: bigint("bytes", { mode: "number" }).notNull().default(0),
    sha256: char("sha256", { length: 64 }),
    expiresAt: datetime("expires_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
  },
  (t) => [
    uniqueIndex("files_storage_key_uq").on(t.storageKey),
    index("files_owner_idx").on(t.ownerUserId),
    index("files_project_idx").on(t.projectId),
  ],
);

export const projects = mysqlTable(
  "projects",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id),
    templateId: bigint("template_id", { mode: "number" })
      .notNull()
      .references(() => bookTemplates.id),
    templateVersionId: bigint("template_version_id", { mode: "number" })
      .notNull()
      .references(() => bookTemplateVersions.id),
    title: varchar("title", { length: 200 }).notNull(),
    status: mysqlEnum("status", [
      "draft",
      "narrative_ready",
      "illustrating",
      "ready",
      "exported",
      "deleted",
    ])
      .notNull()
      .default("draft"),
    personalization: json("personalization"),
    approvedStoryVersionId: bigint("approved_story_version_id", {
      mode: "number",
    }),
    characterVersion: int("character_version").notNull().default(1),
    deletedAt: datetime("deleted_at", { mode: "date", fsp: 3 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("projects_user_status_idx").on(t.userId, t.status),
    index("projects_template_idx").on(t.templateId),
  ],
);

export const projectCharacters = mysqlTable(
  "project_characters",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id),
    role: mysqlEnum("role", ["hero", "companion", "narrator"]).notNull(),
    name: varchar("name", { length: 120 }).notNull(),
    ageBand: varchar("age_band", { length: 8 }),
    description: text("description").notNull(),
    styleTokens: json("style_tokens"),
    bibleVersion: int("bible_version").notNull().default(1),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("project_characters_uq").on(t.projectId, t.role, t.bibleVersion),
  ],
);

export const characterReferences = mysqlTable(
  "character_references",
  {
    id: id(),
    characterId: bigint("character_id", { mode: "number" })
      .notNull()
      .references(() => projectCharacters.id),
    assetId: char("asset_id", { length: 36 }).references(() => files.id),
    kind: mysqlEnum("kind", ["description", "reference_image", "style_sheet"])
      .notNull()
      .default("description"),
    approved: boolean("approved").notNull().default(false),
    notes: text("notes"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("character_refs_char_idx").on(t.characterId)],
);

export const storyVersions = mysqlTable(
  "story_versions",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id),
    version: int("version").notNull(),
    source: mysqlEnum("source", ["deterministic", "ai", "edited"]).notNull(),
    provider: varchar("provider", { length: 60 }),
    promptVersion: varchar("prompt_version", { length: 40 }),
    content: json("content").notNull(),
    status: mysqlEnum("status", [
      "pending",
      "ready",
      "approved",
      "superseded",
    ])
      .notNull()
      .default("pending"),
    createdByUser: boolean("created_by_user").notNull().default(false),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("story_versions_uq").on(t.projectId, t.version),
    index("story_versions_project_idx").on(t.projectId),
  ],
);

export const bookPages = mysqlTable(
  "book_pages",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id),
    pageNo: int("page_no").notNull(),
    kind: mysqlEnum("kind", ["cover", "story", "illustration_only", "back"])
      .notNull()
      .default("story"),
    currentAssetId: char("current_asset_id", { length: 36 }),
    approvedAssetId: char("approved_asset_id", { length: 36 }),
    textOverride: text("text_override"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("book_pages_uq").on(t.projectId, t.pageNo),
    index("book_pages_project_idx").on(t.projectId),
  ],
);

export const illustrationAssets = mysqlTable(
  "illustration_assets",
  {
    id: char("id", { length: 36 }).primaryKey(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id),
    pageId: bigint("page_id", { mode: "number" })
      .notNull()
      .references(() => bookPages.id),
    characterVersion: int("character_version").notNull().default(1),
    prompt: json("prompt"),
    provider: varchar("provider", { length: 60 }),
    providerJobId: varchar("provider_job_id", { length: 120 }),
    status: mysqlEnum("status", [
      "pending",
      "generating",
      "ready",
      "approved",
      "superseded",
      "failed",
    ])
      .notNull()
      .default("pending"),
    fileId: char("file_id", { length: 36 }).references(() => files.id),
    costCents: int("cost_cents").notNull().default(0),
    error: text("error"),
    seed: int("seed"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    index("illustration_assets_project_page_idx").on(t.projectId, t.pageId),
    index("illustration_assets_status_idx").on(t.status),
    index("illustration_assets_provider_job_idx").on(t.providerJobId),
  ],
);

export const generationJobs = mysqlTable(
  "generation_jobs",
  {
    id: id(),
    type: mysqlEnum("type", [
      "narrative",
      "illustration_batch",
      "page_illustration",
      "pdf_export",
    ]).notNull(),
    projectId: bigint("project_id", { mode: "number" }),
    payload: json("payload").notNull(),
    status: mysqlEnum("status", [
      "pending",
      "claimed",
      "processing",
      "completed",
      "failed",
    ])
      .notNull()
      .default("pending"),
    priority: int("priority").notNull().default(100),
    runAfter: datetime("run_after", { mode: "date", fsp: 3 })
      .notNull()
      .default(sql`CURRENT_TIMESTAMP(3)`),
    leaseOwner: char("lease_owner", { length: 36 }),
    leaseExpiresAt: datetime("lease_expires_at", { mode: "date", fsp: 3 }),
    attempts: int("attempts").notNull().default(0),
    maxAttempts: int("max_attempts").notNull().default(5),
    idempotencyKey: char("idempotency_key", { length: 64 }).notNull(),
    progress: json("progress"),
    lastError: text("last_error"),
    costCents: int("cost_cents").notNull().default(0),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [
    uniqueIndex("generation_jobs_idem_uq").on(t.idempotencyKey),
    index("generation_jobs_claim_idx").on(t.status, t.runAfter, t.leaseExpiresAt),
    index("generation_jobs_project_idx").on(t.projectId),
  ],
);

export const generationCosts = mysqlTable(
  "generation_costs",
  {
    id: id(),
    userId: bigint("user_id", { mode: "number" })
      .notNull()
      .references(() => users.id),
    projectId: bigint("project_id", { mode: "number" }),
    jobId: bigint("job_id", { mode: "number" }),
    provider: varchar("provider", { length: 60 }).notNull(),
    kind: mysqlEnum("kind", ["text", "image", "pdf"]).notNull(),
    units: int("units").notNull().default(1),
    unitCostCents: int("unit_cost_cents").notNull().default(0),
    totalCents: int("total_cents").notNull().default(0),
    metadata: json("metadata"),
    createdAt: createdAt(),
  },
  (t) => [
    index("generation_costs_user_idx").on(t.userId, t.createdAt),
    index("generation_costs_project_idx").on(t.projectId),
  ],
);

export const exportJobs = mysqlTable(
  "export_jobs",
  {
    id: id(),
    projectId: bigint("project_id", { mode: "number" })
      .notNull()
      .references(() => projects.id),
    storyVersionId: bigint("story_version_id", { mode: "number" }),
    status: mysqlEnum("status", ["pending", "processing", "ready", "failed"])
      .notNull()
      .default("pending"),
    fileId: char("file_id", { length: 36 }).references(() => files.id),
    pagesRendered: int("pages_rendered").notNull().default(0),
    error: text("error"),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [index("export_jobs_project_idx").on(t.projectId)],
);
