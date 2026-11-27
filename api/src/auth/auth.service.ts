import { Inject, Injectable, UnauthorizedException } from "@nestjs/common";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { BCRYPT_ROUNDS } from "../common/crypto";
import { CONFIG, DB } from "../common/tokens";
import { Config } from "../config";
import { Db, withTenant } from "../db/db";

// Compared against when the user does not exist, so both failures take about the same time.
const DUMMY_HASH = bcrypt.hashSync("not-a-real-password", BCRYPT_ROUNDS);

@Injectable()
export class AuthService {
  constructor(@Inject(DB) private readonly db: Db, @Inject(CONFIG) private readonly config: Config) {}

  async login(tenantSlug: string, email: string, password: string) {
    const tenant = (await this.db.tx((tx) => tx.query<{ id: string; name: string }>("SELECT id, name FROM tenants WHERE slug = $1", [tenantSlug])))[0];
    const user = tenant
      ? (
          await withTenant(this.db, tenant.id, (tx) =>
            tx.query<{ id: string; password_hash: string; full_name: string; role: string }>(
              "SELECT id, password_hash, full_name, role FROM users WHERE email = $1",
              [email.toLowerCase()],
            ),
          )
        )[0]
      : undefined;
    const ok = await bcrypt.compare(password, user?.password_hash ?? DUMMY_HASH);
    if (!tenant || !user || !ok) throw new UnauthorizedException("Invalid credentials");
    const token = jwt.sign({ tid: tenant.id, role: user.role }, this.config.JWT_SECRET, {
      subject: user.id,
      expiresIn: this.config.JWT_TTL_SECONDS,
      algorithm: "HS256",
    });
    return { token, user: { id: user.id, fullName: user.full_name, role: user.role, tenant: { id: tenant.id, name: tenant.name } } };
  }
}
