import { fr } from "@/lib/i18n/fr";

export function SiteFooter() {
  return (
    <footer className="border-t border-line/70 mt-16">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-1 px-4 py-8 text-center text-sm text-ink-soft sm:flex-row sm:justify-between sm:text-left">
        <p className="font-display text-base text-ink">{fr.brand}</p>
        <p>{fr.footer.line}</p>
      </div>
    </footer>
  );
}
