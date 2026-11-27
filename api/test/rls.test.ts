import { Db, withTenant } from "../src/db/db";
import { provisionTenant } from "../src/tenants";
import { freshDb } from "./helpers";

let db: Db;
let a: { tenantId: string; ownerId: string };
let b: { tenantId: string; ownerId: string };

beforeAll(async () => {
  db = await freshDb();
  a = await provisionTenant(db, { slug: "shop-a", name: "Shop A", owner: { email: "a@a.test", password: "password-a-123", fullName: "Owner A" } });
  b = await provisionTenant(db, { slug: "shop-b", name: "Shop B", owner: { email: "b@b.test", password: "password-b-123", fullName: "Owner B" } });
  for (const [t, ref] of [[a, "A-1"], [a, "A-2"], [b, "B-1"]] as const) {
    await withTenant(db, t.tenantId, (tx) =>
      tx.query(
        "INSERT INTO orders (tenant_id, reference, customer_name, phone, city, address, total_cents, currency) VALUES ($1,$2,'Client','0600000000','Casablanca','Rue 1',10000,'MAD')",
        [t.tenantId, ref],
      ),
    );
  }
});
afterAll(() => db.close());

describe("row-level security", () => {
  it("a tenant sees only its own orders, even with no WHERE clause", async () => {
    const rowsA = await withTenant(db, a.tenantId, (tx) => tx.query<{ reference: string }>("SELECT reference FROM orders ORDER BY reference"));
    const rowsB = await withTenant(db, b.tenantId, (tx) => tx.query<{ reference: string }>("SELECT reference FROM orders ORDER BY reference"));
    expect(rowsA.map((r) => r.reference)).toEqual(["A-1", "A-2"]);
    expect(rowsB.map((r) => r.reference)).toEqual(["B-1"]);
  });

  it("a tenant cannot read another tenant's order by id", async () => {
    const [bOrder] = await withTenant(db, b.tenantId, (tx) => tx.query<{ id: string }>("SELECT id FROM orders"));
    const rows = await withTenant(db, a.tenantId, (tx) => tx.query("SELECT * FROM orders WHERE id = $1", [bOrder.id]));
    expect(rows).toHaveLength(0);
  });

  it("a tenant cannot insert a row for another tenant", async () => {
    await expect(
      withTenant(db, a.tenantId, (tx) =>
        tx.query(
          "INSERT INTO orders (tenant_id, reference, customer_name, phone, city, address, total_cents, currency) VALUES ($1,'X-1','C','0600000000','Rabat','Rue 2',100,'MAD')",
          [b.tenantId],
        ),
      ),
    ).rejects.toThrow();
  });

  it("a tenant cannot update or delete another tenant's rows", async () => {
    const upd = await withTenant(db, a.tenantId, (tx) => tx.query("UPDATE orders SET city = 'Hacked' WHERE reference = 'B-1' RETURNING id"));
    const del = await withTenant(db, a.tenantId, (tx) => tx.query("DELETE FROM orders WHERE reference = 'B-1' RETURNING id"));
    expect(upd).toHaveLength(0);
    expect(del).toHaveLength(0);
    const still = await withTenant(db, b.tenantId, (tx) => tx.query("SELECT city FROM orders WHERE reference = 'B-1'"));
    expect(still).toEqual([{ city: "Casablanca" }]);
  });

  it("without a tenant context nothing is visible", async () => {
    const rows = await db.tx(async (tx) => {
      await tx.query("SET LOCAL ROLE app_user");
      return tx.query("SELECT * FROM orders");
    });
    expect(rows).toHaveLength(0);
  });

  it("users are isolated too", async () => {
    const rows = await withTenant(db, a.tenantId, (tx) => tx.query<{ email: string }>("SELECT email FROM users"));
    expect(rows.map((r) => r.email)).toEqual(["a@a.test"]);
  });
});
