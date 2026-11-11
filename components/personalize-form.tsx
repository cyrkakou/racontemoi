"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { fr } from "@/lib/i18n/fr";

interface Field {
  key: string;
  type: "text" | "enum" | "boolean";
  required?: boolean;
  options?: string[];
  maxLength?: number;
  default?: string | boolean;
}

const inputCls =
  "w-full rounded-lg border border-line bg-paper px-4 py-2.5 text-ink placeholder:text-ink-soft/50 focus:border-terra focus:outline-none focus:ring-2 focus:ring-terra/20 transition";

export function PersonalizeForm({
  templateSlug,
  fields,
  redirectBase,
}: {
  templateSlug: string;
  fields: Field[];
  redirectBase: string;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const shape: Record<string, z.ZodTypeAny> = {};
  const defaults: Record<string, unknown> = {};
  for (const f of fields) {
    defaults[f.key] = f.default ?? (f.type === "boolean" ? false : "");
    if (f.type === "boolean") {
      shape[f.key] = z.boolean().optional().default(Boolean(f.default));
    } else if (f.type === "enum") {
      shape[f.key] = f.required
        ? z.enum((f.options ?? []) as [string, ...string[]])
        : z.enum((f.options ?? []) as [string, ...string[]]).optional();
    } else {
      const s = z.string().trim().max(f.maxLength ?? 200);
      shape[f.key] = f.required ? s.min(1, "Ce champ est requis") : s.optional().or(z.literal(""));
    }
  }
  const schema = z.object(shape);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(schema), defaultValues: defaults });

  async function onSubmit(values: Record<string, unknown>) {
    setServerError(null);
    // Map camelCase form keys → snake_case API keys are already snake in schema.
    const personalization: Record<string, unknown> = {};
    for (const f of fields) {
      const v = values[f.key];
      if (v === "" || v === undefined) continue;
      personalization[f.key] = v;
    }
    // defaults the API expects
    if (!personalization.companion) personalization.companion = true;
    if (!personalization.moral_emphasis) personalization.moral_emphasis = "ecoute";

    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ templateSlug, personalization }),
    });
    if (res.status === 401) {
      router.push(`/connexion?next=${encodeURIComponent(redirectBase)}`);
      return;
    }
    const data = await res.json();
    if (!res.ok) {
      setServerError(fr.auth.errors.generic);
      return;
    }
    router.push(`/atelier/${data.projectId}`);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {fields.map((f) => (
        <div key={f.key}>
          {f.type === "boolean" ? (
            <label className="flex cursor-pointer items-center gap-3 text-ink">
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-line accent-terra"
                {...register(f.key)}
              />
              <span className="text-base">{labelFor(f.key)}</span>
            </label>
          ) : f.type === "enum" && f.options?.length ? (
            <fieldset>
              <legend className="mb-2 text-sm font-medium text-ink-soft">{labelFor(f.key)}</legend>
              <div className="flex flex-wrap gap-2">
                {f.options.map((opt) => (
                  <label key={opt} className="cursor-pointer">
                    <input
                      type="radio"
                      value={opt}
                      className="peer sr-only"
                      {...register(f.key)}
                    />
                    <span className="inline-block rounded-full border border-line bg-paper px-4 py-2 text-sm text-ink-soft transition peer-checked:border-terra peer-checked:bg-terra peer-checked:text-paper hover:border-ink-soft/50">
                      {optionLabel(f.key, opt)}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          ) : (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-ink-soft">
                {labelFor(f.key)}
                {f.required ? <span className="text-terra"> *</span> : null}
              </span>
              <input
                type="text"
                className={inputCls}
                maxLength={f.maxLength}
                placeholder={placeholderFor(f.key)}
                {...register(f.key)}
              />
              {errors[f.key] ? (
                <span className="mt-1 block text-sm text-danger">Champ requis</span>
              ) : null}
            </label>
          )}
        </div>
      ))}

      {serverError ? <p className="text-sm text-danger">{serverError}</p> : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-terra px-6 py-3.5 text-base font-medium text-paper shadow-paper transition-colors hover:bg-terra-deep disabled:opacity-60 sm:w-auto"
      >
        {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden /> : null}
        {fr.story.cta}
      </button>
    </form>
  );
}

function labelFor(key: string): string {
  const map: Record<string, string> = {
    hero_name: fr.studio.heroName,
    age_band: fr.studio.ageBand,
    skin_tone: fr.studio.skinTone,
    hair: fr.studio.hair,
    outfit: fr.studio.outfit,
    companion: fr.studio.companion,
    moral_emphasis: fr.studio.moral,
  };
  return map[key] ?? key;
}

function placeholderFor(key: string): string {
  if (key === "hero_name") return "Ex. Awa, Kofi, Lina…";
  if (key === "hair") return "Ex. bouclés, tressés, courts…";
  return "";
}

function optionLabel(key: string, opt: string): string {
  if (key === "age_band") {
    return { "3-5": fr.studio.age35, "6-8": fr.studio.age68, "9-12": fr.studio.age912 }[opt] ?? opt;
  }
  if (key === "moral_emphasis") {
    return { ecoute: "Écouter", partage: "Partager", courage: "Courage" }[opt] ?? opt;
  }
  return opt;
}
