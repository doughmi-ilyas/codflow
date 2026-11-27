import { loadConfig } from "../config";
import { PgDb } from "./db";
import { migrate } from "./migrate";

async function main() {
  const cfg = loadConfig();
  const db = new PgDb(cfg.DATABASE_URL);
  const applied = await migrate(db);
  console.log(applied.length ? `Applied: ${applied.join(", ")}` : "Database is up to date");
  await db.close();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
