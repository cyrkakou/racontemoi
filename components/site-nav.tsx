"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { BookOpen } from "lucide-react";
import { fr } from "@/lib/i18n/fr";

export function SiteNav() {
  const { status } = useSession();
  const authed = status === "authenticated";

  return (
    <header className="border-b border-line/70 bg-paper/90 backdrop-blur-sm sticky top-0 z-40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2.5 group">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-terra text-paper shadow-paper">
            <BookOpen className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
          </span>
          <span className="font-display text-xl font-semibold tracking-tight text-ink">
            {fr.brand}
          </span>
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2 text-sm">
          <Link
            href="/catalogue"
            className="rounded-full px-3 py-2 text-ink-soft hover:text-ink hover:bg-paper-deep transition-colors"
          >
            {fr.nav.catalog}
          </Link>
          {authed ? (
            <>
              <Link
                href="/compte"
                className="rounded-full px-3 py-2 text-ink-soft hover:text-ink hover:bg-paper-deep transition-colors"
              >
                {fr.nav.account}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="rounded-full px-3 py-2 text-ink-soft hover:text-ink hover:bg-paper-deep transition-colors"
              >
                {fr.nav.logout}
              </button>
            </>
          ) : status === "unauthenticated" ? (
            <>
              <Link
                href="/connexion"
                className="rounded-full px-3 py-2 text-ink-soft hover:text-ink hover:bg-paper-deep transition-colors"
              >
                {fr.nav.login}
              </Link>
              <Link
                href="/inscription"
                className="rounded-full bg-ink text-paper px-4 py-2 font-medium hover:bg-terra-deep transition-colors"
              >
                {fr.nav.start}
              </Link>
            </>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
