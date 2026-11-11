import { getPool } from "./index";
import { MIGRATIONS } from "./migrations";

/** Idempotent migration runner — safe to call repeatedly. */
export async function applyMigrations(): Promise<{ applied: string[]; already: string[] }> {
  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.query(
      "CREATE TABLE IF NOT EXISTS __migrations (id VARCHAR(80) NOT NULL PRIMARY KEY, applied_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3)) ENGINE=InnoDB",
    );
    const [rows] = await conn.query("SELECT id FROM __migrations");
    const done = new Set((rows as { id: string }[]).map((r) => r.id));
    const applied: string[] = [];
    const already: string[] = [];

    for (const m of MIGRATIONS) {
      if (done.has(m.id)) {
        already.push(m.id);
        continue;
      }
      const statements = m.sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));
      for (const stmt of statements) {
        await conn.query(stmt);
      }
      await conn.query("INSERT INTO __migrations (id) VALUES (?)", [m.id]);
      applied.push(m.id);
    }
    return { applied, already };
  } finally {
    conn.release();
  }
}
