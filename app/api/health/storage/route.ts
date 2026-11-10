import type { NextRequest } from "next/server";
import {
  privateJson,
  rejectUnauthorizedHealthRequest,
} from "@/lib/http";
import { checkStorage } from "@/lib/storage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const rejection = rejectUnauthorizedHealthRequest(request);
  if (rejection) return rejection;

  const result = await checkStorage();
  return privateJson(result, result.status === "ok" ? 200 : 503);
}
