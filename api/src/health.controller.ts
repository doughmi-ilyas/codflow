import { Controller, Get, Inject } from "@nestjs/common";
import { DB } from "./common/tokens";
import { Db } from "./db/db";

@Controller("health")
export class HealthController {
  constructor(@Inject(DB) private readonly db: Db) {}

  @Get()
  async health() {
    await this.db.tx((tx) => tx.query("SELECT 1"));
    return { status: "ok" };
  }
}
