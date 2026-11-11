import type { NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import { getProjectForUser } from "@/lib/services/projects";
import { getDb } from "@/lib/db";
import { bookPages } from "@/lib/db/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const patchSchema = z.object({
  pageNo: z.number().int().min(1).max(100),
  textOverride: z.string().max(4000).nullable(),
});

export async function PATCH(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const { id } = await ctx.params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) return privateJson({ error: "BAD_ID" }, 400);
  const project = await getProjectForUser(Number(user.id), projectId);
  if (!project) return privateJson({ error: "NOT_FOUND" }, 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "INVALID_JSON" }, 400);
  }
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) return privateJson({ error: "INVALID_INPUT" }, 400);

  const db = getDb();
  await db
    .update(bookPages)
    .set({ textOverride: parsed.data.textOverride, updatedAt: new Date() })
    .where(
      and(eq(bookPages.projectId, projectId), eq(bookPages.pageNo, parsed.data.pageNo)),
    );
  return privateJson({ ok: true });
}
