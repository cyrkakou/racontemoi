import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { StudioClient } from "@/components/studio-client";
import { requireProject, requireUser } from "@/lib/session";
import { fr } from "@/lib/i18n/fr";

export const metadata: Metadata = { title: "Votre livre" };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export default async function AtelierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const projectId = Number(id);
  if (!Number.isInteger(projectId)) notFound();

  const user = await requireUser();
  const project = await requireProject(user.id, projectId);
  if (!project) notFound();
  void fr;

  return <StudioClient projectId={projectId} />;
}
