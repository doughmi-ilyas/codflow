import { Db } from "../src/db/db";
import { seedDemo } from "../src/seed";
import { freshDb } from "./helpers";

let db: Db;
beforeAll(async () => {
  db = await freshDb();
});
afterAll(() => db.close());

describe("demo seed", () => {
  it("creates the two demo shops with four users each, and can run twice", async () => {
    expect(await seedDemo(db)).toEqual(["atlas-shop", "souk-express"]);
    expect(await seedDemo(db)).toEqual([]);
    const rows = await db.tx((tx) => tx.query<{ slug: string; n: string }>("SELECT t.slug, count(u.id) AS n FROM tenants t JOIN users u ON u.tenant_id = t.id GROUP BY t.slug ORDER BY t.slug"));
    expect(rows.map((r) => [r.slug, Number(r.n)])).toEqual([["atlas-shop", 4], ["souk-express", 4]]);
  });
});
