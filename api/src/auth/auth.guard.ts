import { CanActivate, ExecutionContext, Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import jwt from "jsonwebtoken";
import { CONFIG } from "../common/tokens";
import { Config } from "../config";
import { Role } from "../tenants";

export interface AuthUser {
  id: string;
  tenantId: string;
  role: Role;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(CONFIG) private readonly config: Config) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header: string | undefined = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) throw new UnauthorizedException("Missing bearer token");
    try {
      const p = jwt.verify(header.slice(7), this.config.JWT_SECRET, { algorithms: ["HS256"] }) as jwt.JwtPayload;
      req.user = { id: String(p.sub), tenantId: String(p.tid), role: p.role as Role } satisfies AuthUser;
      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }
}
