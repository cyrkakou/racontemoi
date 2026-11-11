"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { fr } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils";
import type { NarrativePage } from "@/lib/ai/types";

interface PageRow {
  pageNo: number;
  kind: string;
  approvedAssetId: string | null;
  textOverride: string | null;
}
interface StoryRow {
  content: { pages?: NarrativePage[] };
}
interface ProjectData {
  project: { id: number; title: string; approvedStoryVersionId: number | null };
  pages: PageRow[];
  stories: StoryRow[];
  assets: { id: string; pageId: number; fileId: string | null; status: string }[];
}

export function ReaderClient({ projectId }: { projectId: number }) {
  const [data, setData] = useState<ProjectData | null>(null);
  const [pageIdx, setPageIdx] = useState(0);
  const touchX = useRef<number | null>(null);

  useEffect(() => {
    void fetch(`/api/projects/${projectId}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setData)
      .catch(() => setData(null));
  }, [projectId]);

  const go = useCallback(
    (d: number) => setPageIdx((i) => Math.max(0, Math.min((data?.pages.length ?? 1) - 1, i + d))),
    [data],
  );

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "Escape") setPageIdx(0);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go]);

  if (!data) {
    return (
      <main className="grid min-h-[60vh] place-items-center">
        <p className="font-display text-xl text-ink-soft">Chargement du livre…</p>
      </main>
    );
  }

  const pages = [...data.pages].sort((a, b) => a.pageNo - b.pageNo);
  const story = data.stories.find((s) => s.content?.pages);
  const storyPages = story?.content.pages ?? [];
  const page = pages[pageIdx];
  const pageContent = storyPages.find((p) => p.no === page?.pageNo);
  const text = page?.textOverride ?? pageContent?.textFr ?? null;
  const assetId = page?.approvedAssetId;
  const fileId = data.assets.find((a) => a.id === assetId)?.fileId ?? null;
  const isCover = page?.kind === "cover" || page?.kind === "back";
  const progress = pages.length ? ((pageIdx + 1) / pages.length) * 100 : 0;

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
      {/* Toolbar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <Link href={`/atelier/${projectId}`} className="inline-flex items-center gap-1.5 text-sm text-ink-soft hover:text-ink">
          <X className="h-4 w-4" aria-hidden />
          {fr.reader.close}
        </Link>
        <p className="text-sm text-ink-soft">
          {fr.reader.pageOf} {pageIdx + 1} / {pages.length}
        </p>
      </div>
      <div
        className="mb-8 h-1 overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={pageIdx + 1}
        aria-valuemin={1}
        aria-valuemax={pages.length}
        aria-label={fr.reader.progress}
      >
        <div className="h-full bg-terra transition-all duration-500" style={{ width: `${progress}%` }} />
      </div>

      {/* Page */}
      <article
        className="paper-grain overflow-hidden rounded-lg border border-line bg-paper shadow-page"
        onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
        onTouchEnd={(e) => {
          if (touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current;
          if (dx < -50) go(1);
          if (dx > 50) go(-1);
          touchX.current = null;
        }}
      >
        {fileId ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/files/${fileId}`}
            alt={pageContent?.illustrationHint ?? `Page ${page?.pageNo}`}
            className={cn("w-full", isCover ? "aspect-[3/4] object-cover" : "aspect-[3/2] object-cover")}
          />
        ) : (
          <div className="grid aspect-[3/2] place-items-center bg-paper-deep text-ink-soft/50">
            <p className="font-display text-lg">Illustration en préparation</p>
          </div>
        )}

        {(text || (isCover && pageContent?.title)) ? (
          <div className={cn("px-6 py-6 sm:px-10", isCover && "text-center")}>
            {isCover && pageContent?.title ? (
              <h2 className="font-display text-3xl font-semibold text-ink sm:text-4xl">
                {pageContent.title}
              </h2>
            ) : null}
            {text ? (
              <p className="story-text mx-auto mt-4 whitespace-pre-line text-ink">
                {text}
              </p>
            ) : null}
          </div>
        ) : null}
      </article>

      {/* Nav */}
      <nav className="mt-8 flex items-center justify-between" aria-label="Navigation du livre">
        <button
          onClick={() => go(-1)}
          disabled={pageIdx === 0}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-soft/40 disabled:opacity-40"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden />
          {fr.reader.prev}
        </button>
        <button
          onClick={() => go(1)}
          disabled={pageIdx >= pages.length - 1}
          className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-4 py-2 text-sm font-medium text-ink transition-colors hover:border-ink-soft/40 disabled:opacity-40"
        >
          {fr.reader.next}
          <ChevronRight className="h-4 w-4" aria-hidden />
        </button>
      </nav>
    </main>
  );
}
