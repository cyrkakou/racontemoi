"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Loader2 } from "lucide-react";
import { fr } from "@/lib/i18n/fr";

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-ink placeholder:text-ink-soft/50 focus:border-terra focus:outline-none focus:ring-2 focus:ring-terra/20 transition";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") ?? "/compte";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await signIn("credentials", {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError(fr.auth.errors.invalid);
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-soft">
          {fr.auth.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-soft">
          {fr.auth.password}
        </label>
        <input id="password" name="password" type="password" required autoComplete="current-password" className={inputCls} />
      </div>
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-terra px-6 py-3 font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        {fr.auth.submitLogin}
      </button>
      <p className="text-center text-sm text-ink-soft">
        {fr.auth.noAccount}{" "}
        <Link href="/inscription" className="font-medium text-terra hover:underline">
          {fr.auth.registerTitle}
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: String(fd.get("name") ?? ""),
        email: String(fd.get("email") ?? ""),
        password: String(fd.get("password") ?? ""),
      }),
    });
    if (!res.ok) {
      setLoading(false);
      setError(res.status === 409 ? fr.auth.errors.emailTaken : fr.auth.errors.generic);
      return;
    }
    await signIn("credentials", {
      email: String(fd.get("email") ?? ""),
      password: String(fd.get("password") ?? ""),
      redirect: false,
    });
    setLoading(false);
    router.push("/compte");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5">
      <div>
        <label htmlFor="name" className="mb-1.5 block text-sm font-medium text-ink-soft">
          {fr.auth.name}
        </label>
        <input id="name" name="name" type="text" required maxLength={120} autoComplete="name" className={inputCls} />
      </div>
      <div>
        <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-ink-soft">
          {fr.auth.email}
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputCls} />
      </div>
      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink-soft">
          {fr.auth.password} <span className="text-ink-soft/60">(8+ caractères)</span>
        </label>
        <input id="password" name="password" type="password" required minLength={8} autoComplete="new-password" className={inputCls} />
      </div>
      {error ? <p className="text-sm text-danger" role="alert">{error}</p> : null}
      <button
        type="submit"
        disabled={loading}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-terra px-6 py-3 font-medium text-paper transition-colors hover:bg-terra-deep disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        {fr.auth.submitRegister}
      </button>
      <p className="text-center text-sm text-ink-soft">
        {fr.auth.hasAccount}{" "}
        <Link href="/connexion" className="font-medium text-terra hover:underline">
          {fr.auth.loginTitle}
        </Link>
      </p>
    </form>
  );
}
