import type { NextRequest } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { privateJson } from "@/lib/http";

export const runtime = "nodejs";

const bodySchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(255).transform((e) => e.toLowerCase()),
  password: z.string().min(8).max(128),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "INVALID_JSON" }, 400);
  }
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) return privateJson({ error: "INVALID_INPUT" }, 400);

  const db = getDb();
  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);
  if (existing) return privateJson({ error: "EMAIL_TAKEN" }, 409);

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const [row] = await db
    .insert(users)
    .values({
      email: parsed.data.email,
      name: parsed.data.name,
      passwordHash,
      locale: "fr",
    })
    .$returningId();

  return privateJson({ ok: true, id: row.id }, 201);
}
