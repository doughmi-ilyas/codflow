import { Pool } from "pg";

/** A query runner bound to one transaction. */
export interface Tx {
  query<T = any>(sql: string, params?: unknown[]): Promise<T[]>;
  /** Run a script with several statements (migrations). No parameters. */
  exec(sql: string): Promise<void>;
}

/** Minimal database port: everything runs inside a transaction. */
export interface Db {
  tx<T>(fn: (tx: Tx) => Promise<T>): Promise<T>;
  close(): Promise<void>;
}

/** Production adapter: node-postgres pool. */
export class PgDb implements Db {
  private pool: Pool;
  constructor(connectionString: string) {
    this.pool = new Pool({ connectionString, max: 10 });
  }
  async tx<T>(fn: (tx: Tx) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const out = await fn({
        query: async (sql, params) => (await client.query(sql, params as any[])).rows,
        exec: async (sql) => void (await client.query(sql)),
      });
      await client.query("COMMIT");
      return out;
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    } finally {
      client.release();
    }
  }
  close() {
    return this.pool.end();
  }
}

/**
 * Run `fn` as the tenant's restricted role. Row-level security policies read
 * `app.tenant_id`, so a query can never see another tenant's rows, even if the
 * application forgets a WHERE clause.
 */
export async function withTenant<T>(db: Db, tenantId: string, fn: (tx: Tx) => Promise<T>): Promise<T> {
  return db.tx(async (tx) => {
    await tx.query("SET LOCAL ROLE app_user");
    await tx.query("SELECT set_config('app.tenant_id', $1, true)", [tenantId]);
    return fn(tx);
  });
}
