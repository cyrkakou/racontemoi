"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { fr } from "@/lib/i18n/fr";
import { cn } from "@/lib/utils";

export function SiteNav() {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const linkCls =
    "link-sweep rounded-full px-3 py-2 text-[0.95rem] text-ink-soft transition-colors hover:text-ink";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 transition-all duration-500",
        scrolled
          ? "border-b border-line/80 bg-paper/85 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-[4.5rem] max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-3">
          <span className="font-display text-[1.65rem] font-semibold tracking-tight text-ink transition-colors group-hover:text-terra-deep">
            {fr.brand}
          </span>
          <span className="hidden border-l border-line pl-3 font-story text-sm italic text-ink-faint sm:inline">
            contes &amp; atelier
          </span>
        </Link>

        <nav className="flex items-center gap-1 text-sm sm:gap-2" aria-label="Navigation principale">
          <Link href="/catalogue" className={linkCls}>
            {fr.nav.catalog}
          </Link>
          {authed ? (
            <>
              <Link href="/compte" className={linkCls}>
                {fr.nav.account}
              </Link>
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className={`${linkCls} cursor-pointer bg-transparent`}
              >
                {fr.nav.logout}
              </button>
            </>
          ) : status === "unauthenticated" ? (
            <>
              <Link href="/connexion" className={linkCls}>
                {fr.nav.login}
              </Link>
              <Link
                href="/inscription"
                className="ml-1 inline-flex items-center rounded-full bg-ink px-5 py-2.5 text-[0.95rem] font-medium text-paper transition-colors duration-300 hover:bg-terra-deep"
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
