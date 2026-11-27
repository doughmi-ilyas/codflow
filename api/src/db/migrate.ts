import { readdirSync, readFileSync } from "fs";
import { join } from "path";
import { Db } from "./db";

const DIR = join(__dirname, "migrations");

/** Apply every .sql file in order, once. Returns the names applied now. */
export async function migrate(db: Db): Promise<string[]> {
  const files = readdirSync(DIR).filter((f) => f.endsWith(".sql")).sort();
  const applied: string[] = [];
  await db.tx(async (tx) => {
    await tx.exec("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())");
    const done = new Set((await tx.query<{ name: string }>("SELECT name FROM schema_migrations")).map((r) => r.name));
    for (const f of files) {
      if (done.has(f)) continue;
      await tx.exec(readFileSync(join(DIR, f), "utf8"));
      await tx.query("INSERT INTO schema_migrations(name) VALUES ($1)", [f]);
      applied.push(f);
    }
  });
  return applied;
}
