import type { NextRequest } from "next/server";
import { checkDatabase } from "@/lib/database";
import {
  privateJson,
  rejectUnauthorizedHealthRequest,
} from "@/lib/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rejection = rejectUnauthorizedHealthRequest(request);
  if (rejection) return rejection;

  const result = await checkDatabase();
  return privateJson(result, result.status === "ok" ? 200 : 503);
}
