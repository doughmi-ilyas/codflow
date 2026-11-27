import { CanActivate, ExecutionContext, ForbiddenException, Inject, Injectable, SetMetadata, UseGuards, applyDecorators } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "../auth/auth.guard";
import { DB } from "../common/tokens";
import { Db, withTenant } from "../db/db";
import { Permission } from "../tenants";
import { PermissionsService } from "./permissions.service";

const KEY = "required-permission";

/** Route needs a signed-in user who holds `permission` in the tenant's role matrix. */
export const Requires = (permission: Permission) => applyDecorators(SetMetadata(KEY, permission), UseGuards(AuthGuard, PermissionGuard));

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector, private readonly perms: PermissionsService, @Inject(DB) private readonly db: Db) {}

  async canActivate(ctx: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<Permission>(KEY, ctx.getHandler());
    if (!permission) return true;
    const user = ctx.switchToHttp().getRequest().user;
    if (!user) throw new ForbiddenException();
    await withTenant(this.db, user.tenantId, (tx) => this.perms.require(tx, user.role, permission));
    return true;
  }
}
