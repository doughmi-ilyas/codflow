import bcrypt from "bcryptjs";
import { loadConfig } from "./config";
import { PgDb } from "./db/db";
import { migrate } from "./db/migrate";
import { provisionTenant } from "./tenants";

/** Demo data for local use: two shops, one team each. Passwords are for local demos only. */
async function main() {
  const db = new PgDb(loadConfig().DATABASE_URL);
  await migrate(db);
  const hash = await bcrypt.hash("demo-password", 10);
  for (const shop of [
    { slug: "atlas-shop", name: "Atlas Shop", city: "Casablanca" },
    { slug: "souk-express", name: "Souk Express", city: "Marrakech" },
  ]) {
    const { tenantId } = await provisionTenant(db, { slug: shop.slug, name: shop.name, owner: { email: `owner@${shop.slug}.test`, password: "demo-password", fullName: `${shop.name} owner` } });
    await db.tx(async (tx) => {
      for (const [role, name] of [["manager", "Manager"], ["agent", "Agent"], ["courier", "Courier"]] as const) {
        await tx.query("INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1,$2,$3,$4,$5)", [tenantId, `${role}@${shop.slug}.test`, hash, `${shop.name} ${name}`, role]);
      }
    });
    console.log(`Seeded ${shop.slug}: owner|manager|agent|courier@${shop.slug}.test / demo-password`);
  }
  await db.close();
}
main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
