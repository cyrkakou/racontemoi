import { createHash, randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { generationJobs } from "@/lib/db/schema";
import { parseJson } from "@/lib/utils";

export type JobType = "narrative" | "illustration_batch" | "page_illustration" | "pdf_export";
export type JobRow = Omit<typeof generationJobs.$inferSelect, "payload" | "progress"> & {
  payload: Record<string, unknown>;
  progress: Record<string, unknown> | null;
};

function hydrateJob(row: typeof generationJobs.$inferSelect): JobRow {
  return {
    ...row,
    payload: parseJson<Record<string, unknown>>(row.payload, {}),
    progress: parseJson<Record<string, unknown> | null>(row.progress, null),
  };
}

export function idempotencyKey(type: JobType, payload: unknown): string {
  return createHash("sha256").update(`${type}:${JSON.stringify(payload)}`).digest("hex");
}

export async function enqueueJob(opts: {
  type: JobType;
  payload: Record<string, unknown>;
  projectId?: number | null;
  priority?: number;
  runAfter?: Date;
  maxAttempts?: number;
}): Promise<{ job: JobRow; created: boolean }> {
  const db = getDb();
  const key = idempotencyKey(opts.type, opts.payload);

  const [existing] = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.idempotencyKey, key))
    .limit(1);
  if (existing) return { job: hydrateJob(existing), created: false };

  try {
    const [job] = await db
      .insert(generationJobs)
      .values({
        type: opts.type,
        projectId: opts.projectId ?? null,
        payload: opts.payload,
        priority: opts.priority ?? 100,
        runAfter: opts.runAfter ?? new Date(),
        maxAttempts: opts.maxAttempts ?? 5,
        idempotencyKey: key,
        progress: { step: "queued" },
      })
      .$returningId();
    const [row] = await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.id, job.id))
      .limit(1);
    return { job: hydrateJob(row), created: true };
  } catch {
    const [row] = await db
      .select()
      .from(generationJobs)
      .where(eq(generationJobs.idempotencyKey, key))
      .limit(1);
    return { job: row ? hydrateJob(row) : ({} as JobRow), created: false };
  }
}

const LEASE_MS = 120_000;

/**
 * Atomically claim up to `limit` pending jobs in ONE UPDATE…JOIN statement.
 * InnoDB row locks serialize concurrent runners; the status='pending' guard
 * makes the second runner's update a no-op on already-claimed rows.
 */
export async function claimJobs(limit: number, owner = randomUUID()): Promise<JobRow[]> {
  const db = getDb();
  const now = new Date();
  const leaseUntil = new Date(now.getTime() + LEASE_MS);

  await db.execute(sql`
    UPDATE generation_jobs j
    JOIN (
      SELECT id FROM generation_jobs
      WHERE status = 'pending' AND run_after <= ${now}
      ORDER BY priority ASC, id ASC
      LIMIT ${limit}
    ) pick ON j.id = pick.id
    SET j.status = 'claimed',
        j.lease_owner = ${owner},
        j.lease_expires_at = ${leaseUntil},
        j.attempts = j.attempts + 1,
        j.updated_at = CURRENT_TIMESTAMP(3)
    WHERE j.status = 'pending'
  `);

  return db
    .select()
    .from(generationJobs)
    .where(and(eq(generationJobs.leaseOwner, owner), eq(generationJobs.status, "claimed")))
    .orderBy(generationJobs.id)
    .then((rows) => rows.map(hydrateJob));
}

export async function startJob(jobId: number) {
  const db = getDb();
  await db
    .update(generationJobs)
    .set({ status: "processing", progress: { step: "running" } })
    .where(eq(generationJobs.id, jobId));
}

export async function progressJob(jobId: number, progress: Record<string, unknown>) {
  const db = getDb();
  await db.update(generationJobs).set({ progress }).where(eq(generationJobs.id, jobId));
}

export async function completeJob(
  jobId: number,
  progress?: Record<string, unknown>,
  costCents = 0,
) {
  const db = getDb();
  await db
    .update(generationJobs)
    .set({
      status: "completed",
      leaseOwner: null,
      leaseExpiresAt: null,
      progress: progress ?? { step: "done" },
      costCents,
      lastError: null,
    })
    .where(eq(generationJobs.id, jobId));
}

export async function failJob(jobId: number, error: string, retryable: boolean) {
  const db = getDb();
  const [job] = await db.select().from(generationJobs).where(eq(generationJobs.id, jobId)).limit(1);
  if (!job) return;

  const exhausted = job.attempts >= job.maxAttempts;
  if (retryable && !exhausted) {
    const backoffMs = Math.min(30_000 * 2 ** job.attempts, 30 * 60_000);
    await db
      .update(generationJobs)
      .set({
        status: "pending",
        runAfter: new Date(Date.now() + backoffMs),
        leaseOwner: null,
        leaseExpiresAt: null,
        lastError: error.slice(0, 2000),
        progress: { step: "retry_scheduled", attempt: job.attempts },
      })
      .where(eq(generationJobs.id, jobId));
  } else {
    await db
      .update(generationJobs)
      .set({
        status: "failed",
        leaseOwner: null,
        leaseExpiresAt: null,
        lastError: error.slice(0, 2000),
        progress: { step: "failed" },
      })
      .where(eq(generationJobs.id, jobId));
  }
}

/** Return expired leases to pending (or fail if attempts exhausted). */
export async function sweepExpiredLeases(): Promise<number> {
  const db = getDb();
  const now = new Date();
  const res = await db.execute(sql`
    UPDATE generation_jobs
    SET status = CASE WHEN attempts >= max_attempts THEN 'failed' ELSE 'pending' END,
        run_after = CASE WHEN attempts >= max_attempts THEN run_after ELSE ${now} END,
        lease_owner = NULL,
        lease_expires_at = NULL,
        last_error = COALESCE(last_error, 'lease_expired'),
        updated_at = CURRENT_TIMESTAMP(3)
    WHERE status IN ('claimed', 'processing')
      AND lease_expires_at IS NOT NULL
      AND lease_expires_at < ${now}
  `);
  return (res as unknown as [{ affectedRows?: number }, unknown])[0]?.affectedRows ?? 0;
}

export async function getJob(jobId: number): Promise<JobRow | null> {
  const db = getDb();
  const [job] = await db.select().from(generationJobs).where(eq(generationJobs.id, jobId)).limit(1);
  return job ? hydrateJob(job) : null;
}

export async function listJobsForProject(projectId: number, limit = 20) {
  const db = getDb();
  const rows = await db
    .select()
    .from(generationJobs)
    .where(eq(generationJobs.projectId, projectId))
    .orderBy(sql`${generationJobs.id} DESC`)
    .limit(limit);
  return rows.map(hydrateJob);
}
