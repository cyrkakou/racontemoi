import { eq, sql } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { generationCosts } from "@/lib/db/schema";

/** Monthly spend check + cost ledger. Demo providers record 0-cost rows. */
export async function recordCost(opts: {
  userId: number;
  projectId?: number | null;
  jobId?: number | null;
  provider: string;
  kind: "text" | "image" | "pdf";
  units?: number;
  unitCostCents?: number;
  metadata?: Record<string, unknown>;
}) {
  const db = getDb();
  const units = opts.units ?? 1;
  const unitCost = opts.unitCostCents ?? 0;
  await db.insert(generationCosts).values({
    userId: opts.userId,
    projectId: opts.projectId ?? null,
    jobId: opts.jobId ?? null,
    provider: opts.provider,
    kind: opts.kind,
    units,
    unitCostCents: unitCost,
    totalCents: units * unitCost,
    metadata: opts.metadata ?? null,
  });
}

export async function monthSpendCents(userId: number): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ total: sql<number>`COALESCE(SUM(${generationCosts.totalCents}),0)` })
    .from(generationCosts)
    .where(eq(generationCosts.userId, userId));
  return Number(row?.total ?? 0);
}

export async function checkBudget(userId: number): Promise<{ ok: boolean; reason?: string }> {
  const cap = Number.parseInt(process.env.AI_BUDGET_MONTHLY_CENTS ?? "0", 10);
  if (!Number.isFinite(cap) || cap <= 0) return { ok: true }; // no cap configured
  const spent = await monthSpendCents(userId);
  if (spent >= cap) return { ok: false, reason: "BUDGET_EXCEEDED" };
  return { ok: true };
}
