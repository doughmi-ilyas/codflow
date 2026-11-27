import { PGlite } from "@electric-sql/pglite";
import { Db, Tx } from "./db";

/** In-process PostgreSQL (WASM). Used for fast local tests; CI also runs against a real server. */
export class PgliteDb implements Db {
  private constructor(private readonly pg: PGlite) {}
  static async create(): Promise<PgliteDb> {
    const pg = new PGlite();
    await pg.waitReady;
    return new PgliteDb(pg);
  }
  tx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    return this.pg.transaction((t) =>
      fn({
        query: async (sql, params) => (await t.query(sql, params as any[])).rows as any[],
        exec: async (sql) => void (await t.exec(sql)),
      }),
    );
  }
  close() {
    return this.pg.close();
  }
}
