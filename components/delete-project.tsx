"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { fr } from "@/lib/i18n/fr";

export function DeleteProjectButton({ projectId }: { projectId: number }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);

  async function del() {
    setBusy(true);
    await fetch(`/api/projects/${projectId}`, { method: "DELETE" });
    router.refresh();
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        className="rounded-full p-2 text-ink-soft hover:bg-danger/10 hover:text-danger"
        title={fr.project.delete}
        aria-label={fr.project.delete}
      >
        <Trash2 className="h-4.5 w-4.5" aria-hidden />
      </button>
    );
  }

  return (
    <span className="absolute right-0 top-full z-10 mt-1 flex w-56 flex-col gap-2 rounded-lg border border-line bg-paper p-3 shadow-page">
      <span className="text-xs text-ink-soft">{fr.project.deleteConfirm}</span>
      <span className="flex gap-2">
        <button
          onClick={del}
          disabled={busy}
          className="rounded-full bg-danger px-3 py-1 text-xs font-medium text-paper disabled:opacity-60"
        >
          {fr.project.deleteYes}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="rounded-full border border-line px-3 py-1 text-xs text-ink-soft"
        >
          {fr.project.deleteNo}
        </button>
      </span>
    </span>
  );
}
