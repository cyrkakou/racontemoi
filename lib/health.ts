import { checkDatabase, type ProbeResult } from "./database";
import { checkStorage } from "./storage";

type DisplayProbe = {
  status: "ok" | "error";
  label: string;
  detail: string;
};

type HomepageHealth = {
  database: DisplayProbe;
  storage: DisplayProbe;
};

type CachedHealth = {
  expiresAt: number;
  value: HomepageHealth;
};

declare global {
  var __africanStorybookHomepageHealth: CachedHealth | undefined;
}

const CACHE_TTL_MS = 30_000;

function toDisplayProbe(result: ProbeResult, subject: string): DisplayProbe {
  if (result.status === "ok") {
    return {
      status: "ok",
      label: "Available",
      detail: `${subject} check completed in ${result.latencyMs} ms.`,
    };
  }

  return {
    status: "error",
    label: result.code === "NOT_CONFIGURED" ? "Not configured" : "Unavailable",
    detail:
      result.code === "NOT_CONFIGURED"
        ? `${subject} environment variables are incomplete.`
        : `${subject} check failed; inspect private server logs.`,
  };
}

export async function getHomepageHealth(): Promise<HomepageHealth> {
  const now = Date.now();
  const cached = globalThis.__africanStorybookHomepageHealth;
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const [database, storage] = await Promise.all([
    checkDatabase(),
    checkStorage(),
  ]);
  const value = {
    database: toDisplayProbe(database, "Database"),
    storage: toDisplayProbe(storage, "Filesystem"),
  };

  globalThis.__africanStorybookHomepageHealth = {
    value,
    expiresAt: now + CACHE_TTL_MS,
  };
  return value;
}
