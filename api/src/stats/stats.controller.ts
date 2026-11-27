import { Controller, Get, Inject, Req } from "@nestjs/common";
import { DB } from "../common/tokens";
import { Db, withTenant } from "../db/db";
import { Requires } from "../permissions/permission.guard";
import { STATUSES } from "../orders/status";

@Controller("stats")
export class StatsController {
  constructor(@Inject(DB) private readonly db: Db) {}

  /** Orders per status and the cash picture: what couriers collected, and what is still out on the road. */
  @Get()
  @Requires("stats:read")
  async stats(@Req() req: any) {
    return withTenant(this.db, req.user.tenantId, async (tx) => {
      const byStatus = await tx.query<{ status: string; n: string; total: string }>(
        "SELECT status, count(*) AS n, coalesce(sum(total_cents), 0) AS total FROM orders GROUP BY status",
      );
      const [cash] = await tx.query<{ collected: string; expected: string }>(
        "SELECT coalesce(sum(cash_collected_cents), 0) AS collected, coalesce(sum(total_cents), 0) AS expected FROM orders WHERE status = 'delivered'",
      );
      const [onRoad] = await tx.query<{ n: string; total: string }>("SELECT count(*) AS n, coalesce(sum(total_cents), 0) AS total FROM orders WHERE status = 'shipped'");
      const counts = Object.fromEntries(STATUSES.map((s) => [s, 0])) as Record<string, number>;
      for (const r of byStatus) counts[r.status] = Number(r.n);
      const delivered = Number(cash.expected);
      const collected = Number(cash.collected);
      return {
        counts,
        cash: { deliveredTotalCents: delivered, collectedCents: collected, differenceCents: collected - delivered, onTheRoadCents: Number(onRoad.total), onTheRoadOrders: Number(onRoad.n) },
      };
    });
  }
}
