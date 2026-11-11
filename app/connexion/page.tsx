import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth-forms";
import { fr } from "@/lib/i18n/fr";

export const metadata: Metadata = { title: fr.auth.loginTitle };

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col justify-center px-4 py-20">
      <h1 className="font-display text-3xl font-semibold text-ink">{fr.auth.loginTitle}</h1>
      <p className="story-text mt-2 text-ink-soft">{fr.auth.loginSub}</p>
      <div className="mt-8 rounded-2xl border border-line bg-paper p-6 shadow-paper sm:p-8">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <p className="mt-6 text-center text-xs text-ink-soft">{fr.auth.privacy}</p>
    </main>
  );
}
