import { createApp } from "./app";
import { loadConfig } from "./config";
import { PgDb } from "./db/db";
import { migrate } from "./db/migrate";

async function main() {
  const config = loadConfig();
  const db = new PgDb(config.DATABASE_URL);
  await migrate(db);
  const app = await createApp(db, config);
  app.enableShutdownHooks();
  await app.listen(config.PORT);
  console.log(`CODFlow API listening on :${config.PORT}`);
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
