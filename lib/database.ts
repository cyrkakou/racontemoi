import { performance } from "node:perf_hooks";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

export type ProbeResult = {
  status: "ok" | "error";
  checkedAt: string;
  latencyMs: number;
  code?:
    | "NOT_CONFIGURED"
    | "ACCESS_DENIED"
    | "DATABASE_NOT_FOUND"
    | "HOST_UNREACHABLE"
    | "CONNECTION_FAILED";
};

function getConnectionErrorCode(error: unknown): ProbeResult["code"] {
  const pending: unknown[] = [error];
  const seen = new Set<unknown>();

  while (pending.length > 0) {
    const current = pending.shift();
    if (typeof current !== "object" || current === null || seen.has(current)) {
      continue;
    }
    seen.add(current);

    const code = "code" in current ? String(current.code) : "";
    if (["ER_ACCESS_DENIED_ERROR", "ER_DBACCESS_DENIED_ERROR"].includes(code)) {
      return "ACCESS_DENIED";
    }
    if (code === "ER_BAD_DB_ERROR") return "DATABASE_NOT_FOUND";
    if (["ECONNREFUSED", "ENOTFOUND", "ETIMEDOUT", "EHOSTUNREACH"].includes(code)) {
      return "HOST_UNREACHABLE";
    }

    if ("cause" in current) pending.push(current.cause);
    if ("errors" in current && Array.isArray(current.errors)) {
      pending.push(...current.errors);
    }
  }
  return "CONNECTION_FAILED";
}

declare global {
  var __africanStorybookMysqlPool: Pool | undefined;
}

const REQUIRED_VARIABLES = [
  "MYSQL_HOST",
  "MYSQL_USER",
  "MYSQL_PASSWORD",
  "MYSQL_DATABASE",
] as const;

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function readPoolOptions(): PoolOptions {
  const missing = REQUIRED_VARIABLES.filter((name) => !process.env[name]);
  if (missing.length > 0) {
    throw new Error("DATABASE_NOT_CONFIGURED");
  }

  const sslEnabled = process.env.MYSQL_SSL === "true";

  return {
    host: process.env.MYSQL_HOST,
    port: parsePositiveInteger(process.env.MYSQL_PORT, 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: parsePositiveInteger(
      process.env.MYSQL_CONNECTION_LIMIT,
      3,
    ),
    connectTimeout: parsePositiveInteger(
      process.env.MYSQL_CONNECT_TIMEOUT_MS,
      5000,
    ),
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: sslEnabled
      ? {
          rejectUnauthorized:
            process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false",
        }
      : undefined,
  };
}

function getPool(): Pool {
  if (!globalThis.__africanStorybookMysqlPool) {
    globalThis.__africanStorybookMysqlPool = mysql.createPool(readPoolOptions());
  }
  return globalThis.__africanStorybookMysqlPool;
}

export async function checkDatabase(): Promise<ProbeResult> {
  const startedAt = performance.now();
  const checkedAt = new Date().toISOString();

  try {
    const database = drizzle(getPool());
    await database.execute(sql`SELECT 1 AS ok`);
    return {
      status: "ok",
      checkedAt,
      latencyMs: Math.round(performance.now() - startedAt),
    };
  } catch (error) {
    const notConfigured =
      error instanceof Error && error.message === "DATABASE_NOT_CONFIGURED";
    return {
      status: "error",
      checkedAt,
      latencyMs: Math.round(performance.now() - startedAt),
      code: notConfigured ? "NOT_CONFIGURED" : getConnectionErrorCode(error),
    };
  }
}
