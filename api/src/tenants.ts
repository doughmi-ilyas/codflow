import bcrypt from "bcryptjs";
import { BCRYPT_ROUNDS } from "./common/crypto";
import { Db } from "./db/db";

export const PERMISSIONS = [
  "orders:read",
  "orders:create",
  "orders:confirm",
  "orders:ship",
  "orders:deliver",
  "stats:read",
  "permissions:manage",
] as const;
export type Permission = (typeof PERMISSIONS)[number];
export const ROLES = ["owner", "manager", "agent", "courier"] as const;
export type Role = (typeof ROLES)[number];

export const DEFAULT_PERMISSIONS: Record<Role, Permission[]> = {
  owner: [...PERMISSIONS],
  manager: ["orders:read", "orders:create", "orders:confirm", "orders:ship", "stats:read"],
  agent: ["orders:read", "orders:create", "orders:confirm"],
  courier: ["orders:read", "orders:deliver"],
};

export interface NewTenant {
  slug: string;
  name: string;
  currency?: string;
  owner: { email: string; password: string; fullName: string };
}

/** Provisioning runs as the database owner (no tenant context): it creates the tenant, its owner and default permissions. */
export async function provisionTenant(db: Db, t: NewTenant): Promise<{ tenantId: string; ownerId: string }> {
  const hash = await bcrypt.hash(t.owner.password, BCRYPT_ROUNDS);
  return db.tx(async (tx) => {
    const [tenant] = await tx.query<{ id: string }>(
      "INSERT INTO tenants (slug, name, currency) VALUES ($1, $2, $3) RETURNING id",
      [t.slug, t.name, t.currency ?? "MAD"],
    );
    const [owner] = await tx.query<{ id: string }>(
      "INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1, $2, $3, $4, 'owner') RETURNING id",
      [tenant.id, t.owner.email.toLowerCase(), hash, t.owner.fullName],
    );
    for (const role of ROLES) {
      for (const p of DEFAULT_PERMISSIONS[role]) {
        await tx.query("INSERT INTO role_permissions (tenant_id, role, permission) VALUES ($1, $2, $3)", [tenant.id, role, p]);
      }
    }
    return { tenantId: tenant.id, ownerId: owner.id };
  });
}
