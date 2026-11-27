import { createApp } from "./app";
import { loadConfig } from "./config";
import { PgDb } from "./db/db";
import { migrate } from "./db/migrate";
import { seedDemo } from "./seed";

async function main() {
  const config = loadConfig();
  const db = new PgDb(config.DATABASE_URL);
  await migrate(db);
  // Optional, for a public demo: SEED_DEMO=true creates the two demo shops once (README lists the logins).
  if (process.env.SEED_DEMO === "true") console.log("Demo seed:", (await seedDemo(db)).join(", ") || "already present");
  const app = await createApp(db, config);
  app.enableShutdownHooks();
  await app.listen(config.PORT, "0.0.0.0");
  console.log(`CODFlow API listening on :${config.PORT}`);
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
