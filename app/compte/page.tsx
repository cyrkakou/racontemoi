import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Download, Trash2 } from "lucide-react";
import { BookCover } from "@/components/book-cover";
import { DeleteProjectButton } from "@/components/delete-project";
import { getSessionUser } from "@/lib/session";
import { listUserProjects } from "@/lib/services/projects";
import { fr } from "@/lib/i18n/fr";

export const metadata: Metadata = { title: fr.account.title };
export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const STATUS: Record<string, string> = {
  draft: fr.project.statusDraft,
  narrative_ready: fr.project.statusNarrative,
  illustrating: fr.project.statusIllustrating,
  ready: fr.project.statusReady,
  exported: fr.project.statusExported,
};

export default async function AccountPage() {
  const user = await getSessionUser();
  if (!user) redirect("/connexion?next=/compte");

  const projects = await listUserProjects(Number(user.id));

  return (
    <main className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
      <header>
        <div className="rule-ornament max-w-[8rem]">
          <p className="eyebrow text-terra-deep">Mon atelier</p>
        </div>
        <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          {fr.account.title}
        </h1>
        <p className="story-text mt-4 max-w-xl text-lg text-ink-soft">
          {fr.account.subtitle}
          {user.name ? <> Bonjour {user.name}.</> : null}
        </p>
      </header>

      {projects.length === 0 ? (
        <div className="mt-14 rounded-2xl border border-dashed border-line bg-paper-deep/50 p-12 text-center">
          <BookOpen className="mx-auto h-10 w-10 text-ink-soft/50" aria-hidden />
          <p className="font-display mt-4 text-xl text-ink">{fr.account.empty}</p>
          <Link
            href="/catalogue"
            className="mt-5 inline-block rounded-full bg-terra px-6 py-3 font-medium text-paper transition-colors hover:bg-terra-deep"
          >
            {fr.account.emptyCta}
          </Link>
        </div>
      ) : (
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => {
            const personalization = p.personalization as { hero_name?: string } | null;
            const heroName = personalization?.hero_name;
            return (
              <li key={p.id} className="group relative">
                <Link href={`/atelier/${p.id}`} className="block">
                  <BookCover
                    seed={p.id * 7919 + (p.characterVersion ?? 1) * 13}
                    title={p.title.split("—")[0]?.trim() ?? p.title}
                    subtitle={heroName ? `pour ${heroName}` : undefined}
                    className="transition-transform duration-500 group-hover:-translate-y-1 group-hover:rotate-0"
                  />
                </Link>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-display text-lg font-semibold text-ink">{p.title}</p>
                    <p className="text-xs text-ink-soft">{STATUS[p.status] ?? p.status}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    {p.status === "ready" || p.status === "exported" ? (
                      <Link
                        href={`/livre/${p.id}`}
                        className="rounded-full p-2 text-botanical hover:bg-botanical/10"
                        title="Lire"
                      >
                        <BookOpen className="h-4.5 w-4.5" aria-hidden />
                      </Link>
                    ) : null}
                    <DeleteProjectButton projectId={p.id} />
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-12 flex items-center gap-2 text-xs text-ink-soft">
        <Download className="h-3.5 w-3.5" aria-hidden />
        <Trash2 className="hidden" aria-hidden />
        Les exports PDF sont disponibles depuis chaque livre.
      </p>
    </main>
  );
}
