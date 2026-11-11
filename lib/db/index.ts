import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql, { type Pool, type PoolOptions } from "mysql2/promise";
import * as schema from "./schema";

export type Db = MySql2Database<typeof schema>;

declare global {
  var __racontemoiDbPool: Pool | undefined;
}

function readPoolOptions(): PoolOptions {
  const missing = ["MYSQL_HOST", "MYSQL_USER", "MYSQL_PASSWORD", "MYSQL_DATABASE"].filter(
    (name) => !process.env[name],
  );
  if (missing.length > 0) {
    throw new Error(`DATABASE_NOT_CONFIGURED: missing ${missing.join(", ")}`);
  }

  const sslEnabled = process.env.MYSQL_SSL === "true";
  const int = (v: string | undefined, fb: number) => {
    const n = Number.parseInt(v ?? "", 10);
    return Number.isInteger(n) && n > 0 ? n : fb;
  };

  return {
    host: process.env.MYSQL_HOST,
    port: int(process.env.MYSQL_PORT, 3306),
    user: process.env.MYSQL_USER,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DATABASE,
    connectionLimit: int(process.env.MYSQL_CONNECTION_LIMIT, 3),
    connectTimeout: int(process.env.MYSQL_CONNECT_TIMEOUT_MS, 5000),
    // Serialize all JS Date values as UTC. The DB session clock is server-local
    // (EST on cPanel); without this, app-written datetimes land ~5h in the
    // future and job-queue comparisons never come due.
    timezone: "Z",
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    ssl: sslEnabled
      ? { rejectUnauthorized: process.env.MYSQL_SSL_REJECT_UNAUTHORIZED !== "false" }
      : undefined,
  };
}

export function getPool(): Pool {
  if (!globalThis.__racontemoiDbPool) {
    globalThis.__racontemoiDbPool = mysql.createPool(readPoolOptions());
  }
  return globalThis.__racontemoiDbPool;
}

export function getDb(): Db {
  return drizzle(getPool(), { schema, mode: "default" });
}
