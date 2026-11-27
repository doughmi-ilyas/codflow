import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "./common/crypto";
import { loadConfig } from "./config";
import { Db, PgDb } from "./db/db";
import { migrate } from "./db/migrate";
import { provisionTenant } from "./tenants";

const SHOPS = [
  { slug: "atlas-shop", name: "Atlas Shop" },
  { slug: "souk-express", name: "Souk Express" },
];

/**
 * Demo data: two shops, one team each (owner, manager, agent, courier), all with the password "demo-password".
 * Safe to run again: a shop that already exists is skipped. For demos only, never for real data.
 */
export async function seedDemo(db: Db): Promise<string[]> {
  const created: string[] = [];
  const hash = await bcrypt.hash("demo-password", BCRYPT_ROUNDS);
  for (const shop of SHOPS) {
    const exists = await db.tx((tx) => tx.query("SELECT 1 FROM tenants WHERE slug = $1", [shop.slug]));
    if (exists.length) continue;
    const { tenantId } = await provisionTenant(db, {
      slug: shop.slug,
      name: shop.name,
      owner: { email: `owner@${shop.slug}.test`, password: "demo-password", fullName: `${shop.name} owner` },
    });
    await db.tx(async (tx) => {
      for (const [role, name] of [["manager", "Manager"], ["agent", "Agent"], ["courier", "Courier"]] as const) {
        await tx.query("INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1,$2,$3,$4,$5)", [tenantId, `${role}@${shop.slug}.test`, hash, `${shop.name} ${name}`, role]);
      }
    });
    created.push(shop.slug);
  }
  return created;
}

async function main() {
  const db = new PgDb(loadConfig().DATABASE_URL);
  await migrate(db);
  const created = await seedDemo(db);
  console.log(created.length ? `Seeded: ${created.join(", ")} (owner|manager|agent|courier@<shop>.test / demo-password)` : "Demo shops already exist");
  await db.close();
}

if (require.main === module) {
  main().catch((e) => {
    console.error(e.message);
    process.exit(1);
  });
}
