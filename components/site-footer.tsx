import Link from "next/link";
import { fr } from "@/lib/i18n/fr";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-deep/40">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-sm">
            <p className="font-display text-2xl font-semibold text-ink">{fr.brand}</p>
            <p className="story-text mt-3 text-[0.95rem] italic text-ink-soft">{fr.tagline}</p>
          </div>
          <nav className="flex flex-col gap-2 text-sm" aria-label="Pied de page">
            <Link href="/catalogue" className="link-sweep w-fit text-ink-soft hover:text-ink">
              {fr.nav.catalog}
            </Link>
            <Link href="/inscription" className="link-sweep w-fit text-ink-soft hover:text-ink">
              {fr.nav.start}
            </Link>
            <Link href="/connexion" className="link-sweep w-fit text-ink-soft hover:text-ink">
              {fr.nav.login}
            </Link>
          </nav>
        </div>
        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between">
          <p>{fr.footer.line}</p>
          <p className="eyebrow">Fait avec soin, à la main</p>
        </div>
      </div>
    </footer>
  );
}
