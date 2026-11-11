import type { NextRequest } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/session";
import { privateJson } from "@/lib/http";
import {
  createProject,
  listUserProjects,
  personalizationSchema,
} from "@/lib/services/projects";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);
  const projects = await listUserProjects(Number(user.id));
  return privateJson({ projects });
}

const createSchema = z.object({
  templateSlug: z.string().min(1).max(120),
  personalization: personalizationSchema,
});

export async function POST(request: NextRequest) {
  const user = await getSessionUser();
  if (!user) return privateJson({ error: "UNAUTHORIZED" }, 401);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return privateJson({ error: "INVALID_JSON" }, 400);
  }
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return privateJson({ error: "INVALID_INPUT", details: parsed.error.flatten() }, 400);
  }

  try {
    const result = await createProject(
      Number(user.id),
      parsed.data.templateSlug,
      parsed.data.personalization,
    );
    return privateJson({ ok: true, ...result }, 201);
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "TEMPLATE_NOT_FOUND") return privateJson({ error: msg }, 404);
    return privateJson({ error: "CREATE_FAILED", detail: msg }, 500);
  }
}
