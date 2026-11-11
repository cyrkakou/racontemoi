"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Check,
  ChevronRight,
  Download,
  Feather,
  Loader2,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import { fr } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils";
import type { NarrativePage } from "@/lib/ai/types";

interface PageRow {
  id: number;
  pageNo: number;
  kind: string;
  currentAssetId: string | null;
  approvedAssetId: string | null;
  textOverride: string | null;
}
interface AssetRow {
  id: string;
  pageId: number;
  status: string;
  fileId: string | null;
  createdAt: string;
}
interface StoryRow {
  id: number;
  version: number;
  source: string;
  status: string;
  content: { pages?: NarrativePage[] };
}
interface JobRow {
  id: number;
  type: string;
  status: string;
  progress: { step?: string } | null;
}
interface ExportRow {
  id: number;
  status: string;
  fileId: string | null;
}
interface ProjectData {
  project: {
    id: number;
    title: string;
    status: string;
    approvedStoryVersionId: number | null;
    personalization: Record<string, unknown> | null;
  };
  pages: PageRow[];
  characters: { id: number; role: string; name: string; description: string; bibleVersion: number }[];
  stories: StoryRow[];
  assets: AssetRow[];
  jobs: JobRow[];
  exports: ExportRow[];
}

const STATUS_LABEL: Record<string, string> = {
  draft: fr.project.statusDraft,
  narrative_ready: fr.project.statusNarrative,
  illustrating: fr.project.statusIllustrating,
  ready: fr.project.statusReady,
  exported: fr.project.statusExported,
};

export function StudioClient({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${projectId}`, { cache: "no-store" });
    if (!res.ok) {
      setError("NOT_FOUND");
      return;
    }
    setData(await res.json());
  }, [projectId]);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/projects/${projectId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("NOT_FOUND"))))
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch(() => {
        if (!cancelled) setError("NOT_FOUND");
      });
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  const activeJob = useMemo(
    () => data?.jobs.find((j) => ["pending", "claimed", "processing"].includes(j.status)),
    [data],
  );

  // Poll while a job is active (bounded: stops when none active)
  useEffect(() => {
    if (pollRef.current) clearInterval(pollRef.current);
    if (activeJob) {
      pollRef.current = setInterval(() => void refresh(), 2500);
    }
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [activeJob?.id, activeJob?.status, refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  async function post(url: string, body: unknown, busyKey: string) {
    setBusy(busyKey);
    setError(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j.error ?? "ERROR");
        return;
      }
      await refresh();
    } finally {
      setBusy(null);
    }
  }

  if (error === "NOT_FOUND") {
    return <Centered message="Livre introuvable." />;
  }
  if (!data) return <Centered spinner />;

  const { project, pages, characters, stories, assets, exports: exportsList } = data;
  const hero = characters.find((c) => c.role === "hero");
  const allApproved = pages.length > 0 && pages.every((p) => p.approvedAssetId);
  const latestExport = exportsList.find((e) => e.status === "ready");

  const steps = [
    { key: "bible", label: fr.studio.stepPersonalize, done: !!hero },
    { key: "story", label: fr.studio.stepStory, done: !!project.approvedStoryVersionId },
    { key: "illustrate", label: fr.studio.stepIllustrate, done: allApproved },
    { key: "read", label: fr.studio.stepRead, done: project.status === "exported" },
  ];

  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      {/* Header + stepper */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-ink-soft">
            {STATUS_LABEL[project.status] ?? project.status}
          </p>
          <h1 className="font-display mt-1 text-3xl font-semibold text-ink sm:text-4xl">
            {project.title}
          </h1>
        </div>
        <Link
          href="/compte"
          className="text-sm text-ink-soft hover:text-ink transition-colors"
        >
          ← {fr.reader.backToBook}
        </Link>
      </header>

      <ol className="mt-8 flex flex-wrap gap-2" aria-label="Étapes">
        {steps.map((s, i) => (
          <li
            key={s.key}
            className={cn(
              "flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm",
              s.done
                ? "border-botanical/40 bg-botanical/10 text-botanical"
                : "border-line bg-paper text-ink-soft",
            )}
          >
            {s.done ? <Check className="h-3.5 w-3.5" aria-hidden /> : <span className="font-display">{i + 1}</span>}
            {s.label}
          </li>
        ))}
      </ol>

      {activeJob ? (
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-ochre/40 bg-ochre/10 px-4 py-3 text-sm text-ink">
          <Loader2 className="h-4 w-4 animate-spin text-ochre" aria-hidden />
          {jobLabel(activeJob)} — {fr.jobs[activeJob.status as keyof typeof fr.jobs] ?? activeJob.status}
        </div>
      ) : null}
      {error && error !== "NOT_FOUND" ? (
        <p className="mt-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}

      {/* Step 1 — Character bible */}
      <section className="mt-10 rounded-2xl border border-line bg-paper p-6 shadow-paper sm:p-8">
        <h2 className="font-display flex items-center gap-2 text-2xl font-semibold text-ink">
          <Feather className="h-5 w-5 text-terra" aria-hidden />
          {fr.studio.bibleTitle}
        </h2>
        {hero ? (
          <div className="story-text mt-4 text-ink-soft">
            <p>
              <strong className="text-ink">{hero.name}</strong> — {hero.description}
            </p>
            <p className="mt-2 text-sm">
              Version de fiche {hero.bibleVersion} ·{" "}
              {characters.filter((c) => c.role === "companion").length > 0
                ? "compagnon de route inclus"
                : "sans compagnon"}
            </p>
          </div>
        ) : (
          <p className="mt-3 text-ink-soft">Personnalisation en cours…</p>
        )}
      </section>

      {/* Step 2 — Story */}
      <section className="mt-8 rounded-2xl border border-line bg-paper p-6 shadow-paper sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold text-ink">{fr.studio.stepStory}</h2>
          {!project.approvedStoryVersionId ? (
            <button
              onClick={() => post(`/api/projects/${projectId}/narrative`, { action: "generate" }, "narrative")}
              disabled={busy === "narrative" || !!activeJob}
              className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-60"
            >
              {busy === "narrative" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Sparkles className="h-4 w-4" aria-hidden />}
              {fr.studio.writeStory}
            </button>
          ) : null}
        </div>

        {stories.length === 0 ? (
          <p className="story-text mt-4 text-ink-soft">
            Écrivez l’histoire : le texte sera généré page par page, dans le style du conte.
          </p>
        ) : (
          <div className="mt-6 space-y-4">
            {stories.map((s) => (
              <StoryCard
                key={s.id}
                story={s}
                isApproved={project.approvedStoryVersionId === s.id}
                projectId={projectId}
                onChanged={refresh}
                busy={busy}
              />
            ))}
          </div>
        )}
      </section>

      {/* Step 3 — Illustrations */}
      {project.approvedStoryVersionId ? (
        <section className="mt-8 rounded-2xl border border-line bg-paper p-6 shadow-paper sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-2xl font-semibold text-ink">{fr.studio.stepIllustrate}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => post(`/api/projects/${projectId}/illustrations`, { action: "batch" }, "batch")}
                disabled={busy === "batch" || !!activeJob}
                className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-60"
              >
                {busy === "batch" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Feather className="h-4 w-4" aria-hidden />}
                {fr.studio.illustrate}
              </button>
            </div>
          </div>

          <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {pages.map((p) => {
              const assetId = p.approvedAssetId ?? p.currentAssetId;
              const asset = assets.find((a) => a.id === assetId && a.fileId);
              return (
                <li key={p.id} className="group">
                  <PageThumb
                    page={p}
                    fileId={asset?.fileId ?? null}
                    projectId={projectId}
                    assets={assets.filter((a) => a.pageId === p.id)}
                    onChanged={refresh}
                    disabled={!!activeJob}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}

      {/* Step 4 — Read & export */}
      {allApproved ? (
        <section className="mt-8 rounded-2xl border border-botanical/40 bg-botanical/5 p-6 shadow-paper sm:p-8">
          <h2 className="font-display flex items-center gap-2 text-2xl font-semibold text-ink">
            <BookOpen className="h-5 w-5 text-botanical" aria-hidden />
            {fr.studio.stepRead}
          </h2>
          <p className="story-text mt-3 text-ink-soft">
            {fr.project.statusReady} — {pages.length} pages illustrées et approuvées.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href={`/livre/${projectId}`}
              className="inline-flex items-center gap-2 rounded-full bg-botanical px-6 py-3 font-medium text-paper transition-colors hover:bg-botanical/90"
            >
              <BookOpen className="h-4 w-4" aria-hidden />
              {fr.studio.readBook}
            </Link>
            {latestExport ? (
              <a
                href={`/api/projects/${projectId}/export/${latestExport.id}`}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-6 py-3 font-medium text-ink transition-colors hover:border-ink-soft/40"
              >
                <Download className="h-4 w-4" aria-hidden />
                {fr.project.download} PDF
              </a>
            ) : (
              <button
                onClick={() => post(`/api/projects/${projectId}/export`, {}, "export")}
                disabled={busy === "export" || !!activeJob}
                className="inline-flex items-center gap-2 rounded-full border border-line bg-paper px-6 py-3 font-medium text-ink transition-colors hover:border-ink-soft/40 disabled:opacity-60"
              >
                {busy === "export" ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Download className="h-4 w-4" aria-hidden />}
                {fr.studio.exportPdf}
              </button>
            )}
          </div>
          {latestExport ? (
            <p className="mt-3 text-xs text-ink-soft">
              Export PDF prêt — <a className="underline" href={`/api/projects/${projectId}/export/${latestExport.id}`}>télécharger</a>
            </p>
          ) : null}
        </section>
      ) : null}
    </main>
  );
}

function jobLabel(job: JobRow): string {
  switch (job.type) {
    case "narrative": return fr.studio.writing;
    case "illustration_batch":
    case "page_illustration": return fr.studio.illustrating;
    case "pdf_export": return "Export PDF…";
    default: return job.type;
  }
}

function Centered({ message, spinner }: { message?: string; spinner?: boolean }) {
  return (
    <main className="grid min-h-[50vh] place-items-center">
      {spinner ? <Loader2 className="h-8 w-8 animate-spin text-terra" aria-label="Chargement" /> : (
        <p className="font-display text-xl text-ink-soft">{message}</p>
      )}
    </main>
  );
}

function StoryCard({
  story,
  isApproved,
  projectId,
  onChanged,
  busy,
}: {
  story: StoryRow;
  isApproved: boolean;
  projectId: number;
  onChanged: () => Promise<void>;
  busy: string | null;
}) {
  const [open, setOpen] = useState(isApproved);
  const pages = story.content?.pages ?? [];
  const textPages = pages.filter((p) => p.textFr);

  return (
    <article className={cn("rounded-xl border", isApproved ? "border-botanical/50 bg-botanical/5" : "border-line bg-paper-deep/40")}>
      <header className="flex items-center justify-between gap-3 px-4 py-3">
        <button onClick={() => setOpen(!open)} className="flex items-center gap-2 text-left">
          <ChevronRight className={cn("h-4 w-4 transition-transform", open && "rotate-90")} aria-hidden />
          <span className="font-medium text-ink">
            {fr.studio.versionDeterministic} · v{story.version}
          </span>
          {isApproved ? (
            <span className="rounded-full bg-botanical px-2.5 py-0.5 text-xs font-medium text-paper">Approuvée</span>
          ) : null}
        </button>
        {!isApproved ? (
          <button
            onClick={async () => {
              await fetch(`/api/projects/${projectId}/narrative`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "approve", versionId: story.id }),
              });
              await onChanged();
            }}
            disabled={busy !== null}
            className="rounded-full bg-terra px-4 py-1.5 text-sm font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-60"
          >
            {fr.studio.approveStory}
          </button>
        ) : null}
      </header>
      {open ? (
        <div className="max-h-96 space-y-4 overflow-y-auto border-t border-line/60 px-4 py-4">
          {textPages.map((p) => (
            <div key={p.no}>
              <p className="text-xs font-medium uppercase tracking-wide text-ink-soft/70">
                Page {p.no}
              </p>
              <p className="story-text mt-1 text-ink">{p.textFr}</p>
            </div>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function PageThumb({
  page,
  fileId,
  projectId,
  assets,
  onChanged,
  disabled,
}: {
  page: PageRow;
  fileId: string | null;
  projectId: number;
  assets: AssetRow[];
  onChanged: () => Promise<void>;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const latest = assets[assets.length - 1];
  const isApproved = !!page.approvedAssetId;

  async function act(body: Record<string, unknown>) {
    await fetch(`/api/projects/${projectId}/illustrations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    await onChanged();
  }

  return (
    <figure className="overflow-hidden rounded-lg border border-line bg-paper-deep/60">
      <div className="relative aspect-[3/4] bg-paper-deep">
        {fileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/files/${fileId}`} alt={`Illustration page ${page.pageNo}`} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center text-ink-soft/50">
            <BookOpen className="h-8 w-8" aria-hidden />
          </div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-medium text-paper">
          {page.pageNo}
        </span>
        {isApproved ? (
          <span className="absolute right-2 top-2 rounded-full bg-botanical px-2 py-0.5 text-[10px] font-medium text-paper">
            {fr.studio.pageDone}
          </span>
        ) : null}
      </div>
      <figcaption className="flex items-center justify-between gap-1 p-2">
        <button
          onClick={() => setConfirming(true)}
          disabled={disabled}
          title={fr.studio.regenerate}
          className="rounded-md p-1.5 text-ink-soft hover:bg-paper-deep hover:text-ink disabled:opacity-40"
        >
          <RefreshCw className="h-4 w-4" aria-hidden />
        </button>
        {latest && !isApproved ? (
          <button
            onClick={() => act({ action: "approve", pageNo: page.pageNo, assetId: latest.id })}
            disabled={disabled}
            title={fr.studio.approvePage}
            className="rounded-md p-1.5 text-botanical hover:bg-botanical/10 disabled:opacity-40"
          >
            <Check className="h-4 w-4" aria-hidden />
          </button>
        ) : null}
      </figcaption>
      {confirming ? (
        <div className="border-t border-line/60 bg-paper-deep/80 p-3 text-xs">
          <p className="text-ink-soft">Régénérer la page {page.pageNo} ?</p>
          <div className="mt-2 flex gap-2">
            <button
              onClick={() => { setConfirming(false); void act({ action: "page", pageNo: page.pageNo, regenerate: true }); }}
              className="rounded-full bg-terra px-3 py-1 text-paper"
            >
              {fr.studio.confirm}
            </button>
            <button onClick={() => setConfirming(false)} className="rounded-full border border-line px-3 py-1 text-ink-soft">
              {fr.studio.cancel}
            </button>
          </div>
        </div>
      ) : null}
    </figure>
  );
}
