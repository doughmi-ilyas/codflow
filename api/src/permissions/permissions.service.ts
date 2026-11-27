import { ForbiddenException, Inject, Injectable } from "@nestjs/common";
import { DB } from "../common/tokens";
import { Db, Tx, withTenant } from "../db/db";
import { PERMISSIONS, Permission, ROLES, Role } from "../tenants";

@Injectable()
export class PermissionsService {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Inside an existing tenant transaction. */
  async has(tx: Tx, role: Role, permission: Permission): Promise<boolean> {
    const rows = await tx.query("SELECT 1 FROM role_permissions WHERE role = $1 AND permission = $2", [role, permission]);
    return rows.length > 0;
  }

  async require(tx: Tx, role: Role, permission: Permission): Promise<void> {
    if (!(await this.has(tx, role, permission))) throw new ForbiddenException(`Missing permission ${permission}`);
  }

  async matrix(tenantId: string): Promise<Record<Role, Permission[]>> {
    const rows = await withTenant(this.db, tenantId, (tx) =>
      tx.query<{ role: Role; permission: Permission }>("SELECT role, permission FROM role_permissions ORDER BY role, permission"),
    );
    const out = Object.fromEntries(ROLES.map((r) => [r, [] as Permission[]])) as Record<Role, Permission[]>;
    for (const r of rows) out[r.role].push(r.permission);
    return out;
  }

  /** Replace one role's permissions. The owner always keeps permissions:manage, so nobody can lock the tenant out. */
  async setRole(tenantId: string, role: Role, permissions: Permission[]): Promise<Permission[]> {
    const next = new Set<Permission>(permissions);
    if (role === "owner") next.add("permissions:manage");
    await withTenant(this.db, tenantId, async (tx) => {
      await tx.query("DELETE FROM role_permissions WHERE role = $1", [role]);
      for (const p of next) {
        await tx.query("INSERT INTO role_permissions (tenant_id, role, permission) VALUES ($1, $2, $3)", [tenantId, role, p]);
      }
    });
    return [...next].sort();
  }
}

export const isPermission = (p: string): p is Permission => (PERMISSIONS as readonly string[]).includes(p);
