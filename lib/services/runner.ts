import {
  claimJobs,
  failJob,
  sweepExpiredLeases,
  type JobRow,
} from "./jobs";
import { handleNarrativeJob } from "./narrative";
import {
  handleIllustrationBatchJob,
  handlePageIllustrationJob,
} from "./illustrations";
import { handlePdfExportJob } from "./exports";

const HANDLERS: Record<JobRow["type"], (job: JobRow) => Promise<void>> = {
  narrative: handleNarrativeJob,
  illustration_batch: handleIllustrationBatchJob,
  page_illustration: handlePageIllustrationJob,
  pdf_export: handlePdfExportJob,
};

const JOB_TIMEOUT_MS = 25_000; // stay well under Passenger/LiteSpeed limits

/**
 * Bounded batch runner — invoked by the /api/cron/run route every minute.
 * Claims a small batch, executes each with a timeout, never loops forever.
 */
export async function runJobBatch(opts: {
  batchSize?: number;
  budgetMs?: number;
}): Promise<{ claimed: number; completed: number; failed: number; swept: number }> {
  const batchSize = opts.batchSize ?? 3;
  const budgetMs = opts.budgetMs ?? JOB_TIMEOUT_MS;
  const started = Date.now();

  const swept = await sweepExpiredLeases();
  const jobs = await claimJobs(batchSize);

  let completed = 0;
  let failed = 0;

  for (const job of jobs) {
    if (Date.now() - started > budgetMs) {
      // Return unprocessed claims to pending so the next tick picks them up.
      const { failJob: fj } = await import("./jobs");
      await fj(job.id, "runner_budget_exceeded", true);
      continue;
    }
    try {
      const handler = HANDLERS[job.type];
      if (!handler) throw new Error(`NO_HANDLER:${job.type}`);
      await withTimeout(handler(job), budgetMs);
      completed++;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await failJob(job.id, message, true);
      failed++;
    }
  }

  return { claimed: jobs.length, completed, failed, swept };
}

function withTimeout<T>(p: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    p,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error("JOB_TIMEOUT")), ms),
    ),
  ]);
}
