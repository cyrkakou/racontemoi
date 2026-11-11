import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { applyMigrations } from "@/lib/db/migrate";
import { seedEditorial } from "@/lib/db/seed";
import { isAdminRequest } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAdminRequest(request)) {
    return NextResponse.json({ error: "NOT_AUTHORIZED" }, { status: 403 });
  }
  try {
    const migrations = await applyMigrations();
    const seed = await seedEditorial();
    return NextResponse.json({ ok: true, migrations, seed });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : String(error) },
      { status: 500 },
    );
  }
}
