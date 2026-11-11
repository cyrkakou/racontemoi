import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { eq, and, isNull } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { projects } from "@/lib/db/schema";

export type SessionUser = { id: string; email?: string | null; name?: string | null };

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;
  return {
    id,
    email: session.user?.email ?? null,
    name: session.user?.name ?? null,
  };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/connexion");
  return user;
}

export async function requireProject(userId: string, projectId: number) {
  const db = getDb();
  const [project] = await db
    .select()
    .from(projects)
    .where(
      and(
        eq(projects.id, projectId),
        eq(projects.userId, Number(userId)),
        isNull(projects.deletedAt),
      ),
    )
    .limit(1);
  return project ?? null;
}
