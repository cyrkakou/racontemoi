import { NextResponse } from "next/server";
import { APPLICATION_NAME, NEXT_VERSION } from "@/lib/runtime";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      application: APPLICATION_NAME,
      runtime: {
        node: process.version,
        next: NEXT_VERSION,
      },
      timestamp: new Date().toISOString(),
    },
    {
      status: 200,
      headers: {
        "Cache-Control": "no-store, max-age=0",
        "X-Content-Type-Options": "nosniff",
      },
    },
  );
}
