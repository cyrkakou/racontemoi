import type { Metadata } from "next";
import { RegisterForm } from "@/components/auth-forms";
import { fr } from "@/lib/i18n/fr";

export const metadata: Metadata = { title: fr.auth.registerTitle };

export default function RegisterPage() {
  return (
    <main className="mx-auto flex max-w-lg flex-col justify-center px-4 py-24">
      <div className="rule-ornament max-w-[8rem]">
        <p className="eyebrow text-terra-deep">L’atelier</p>
      </div>
      <h1 className="mt-6 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
        {fr.auth.registerTitle}
      </h1>
      <p className="story-text mt-4 text-lg text-ink-soft">{fr.auth.registerSub}</p>
      <div className="mt-10 border-t-2 border-ink/80 pt-8">
        <RegisterForm />
      </div>
      <p className="mt-8 text-center text-xs text-ink-soft">{fr.auth.privacy}</p>
    </main>
  );
}
