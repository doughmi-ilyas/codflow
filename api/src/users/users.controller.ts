import { Controller, Get, Inject, Req } from "@nestjs/common";
import { DB } from "../common/tokens";
import { Db, withTenant } from "../db/db";
import { Requires } from "../permissions/permission.guard";

@Controller("users")
export class UsersController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Couriers of the tenant, for the "ship this order" picker. Password hashes are never selected. */
  @Get("couriers")
  @Requires("orders:ship")
  couriers(@Req() req: any) {
    return withTenant(this.db, req.user.tenantId, (tx) => tx.query("SELECT id, full_name FROM users WHERE role = 'courier' ORDER BY full_name"));
  }
}
