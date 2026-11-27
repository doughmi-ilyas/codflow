import { Body, Controller, Get, NotFoundException, Param, Put, Req } from "@nestjs/common";
import { z } from "zod";
import { parse } from "../common/validate";
import { PERMISSIONS, ROLES, Role } from "../tenants";
import { Requires } from "./permission.guard";
import { PermissionsService } from "./permissions.service";

const bodySchema = z.object({ permissions: z.array(z.enum(PERMISSIONS)).max(PERMISSIONS.length) });

@Controller("permissions")
export class PermissionsController {
  constructor(private readonly perms: PermissionsService) {}

  @Get()
  @Requires("permissions:manage")
  async get(@Req() req: any) {
    return { roles: ROLES, permissions: PERMISSIONS, matrix: await this.perms.matrix(req.user.tenantId) };
  }

  @Put(":role")
  @Requires("permissions:manage")
  async put(@Req() req: any, @Param("role") role: string, @Body() body: unknown) {
    if (!(ROLES as readonly string[]).includes(role)) throw new NotFoundException("Unknown role");
    const b = parse(bodySchema, body);
    return { role, permissions: await this.perms.setRole(req.user.tenantId, role as Role, b.permissions) };
  }
}
