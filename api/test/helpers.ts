import { migrate } from "../src/db/migrate";
import { Db } from "../src/db/db";
import { PgliteDb } from "../src/db/pglite-db";
import { PgDb } from "../src/db/db";

/** Fresh migrated database. Uses TEST_DATABASE_URL (real PostgreSQL, as in CI) or in-process PGlite. */
export async function freshDb(): Promise<Db> {
  const url = process.env.TEST_DATABASE_URL;
  const db: Db = url ? new PgDb(url) : await PgliteDb.create();
  if (url) {
    await db.tx(async (tx) => {
      await tx.exec("DROP SCHEMA public CASCADE; CREATE SCHEMA public");
    });
  }
  await migrate(db);
  return db;
}
