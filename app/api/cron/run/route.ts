import type { NextRequest } from "next/server";
import { timingSafeEqual, createHash } from "node:crypto";
import { runJobBatch } from "@/lib/services/runner";
import { privateJson } from "@/lib/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function authorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const header = request.headers.get("x-cron-secret") ?? "";
  const digest = (v: string) => createHash("sha256").update(v).digest();
  return timingSafeEqual(digest(header), digest(secret));
}

/**
 * Bounded job runner — invoked every minute by cPanel cron:
 *   wget -q -O- --header="x-cron-secret: $CRON_SECRET" https://book.atikpa.com/api/cron/run
 * Claims ≤3 jobs, ~25s budget, returns counts. Safe to call concurrently
 * (atomic claiming) and idempotent.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) {
    return privateJson({ error: "UNAUTHORIZED" }, 401);
  }
  const result = await runJobBatch({ batchSize: 3, budgetMs: 25_000 });
  return privateJson({ ok: true, ...result });
}
