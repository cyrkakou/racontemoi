import { performance } from "node:perf_hooks";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import mysql, { type Pool, type PoolOptions } from "mysql2/promise";

export type ProbeResult = {
  status: "ok" | "error";
  checkedAt: string;
  latencyMs: number;
  code?: "NOT_CONFIGURED" | "CONNECTION_FAILED";
};

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
      code: notConfigured ? "NOT_CONFIGURED" : "CONNECTION_FAILED",
    };
  }
}
