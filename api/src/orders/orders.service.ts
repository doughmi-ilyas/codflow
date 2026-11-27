import { BadRequestException, ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { randomBytes } from "crypto";
import { AuthUser } from "../auth/auth.guard";
import { DB } from "../common/tokens";
import { Db, Tx, withTenant } from "../db/db";
import { PermissionsService } from "../permissions/permissions.service";
import { Status, canMove, permissionFor } from "./status";

export interface OrderRow {
  id: string;
  reference: string;
  customer_name: string;
  phone: string;
  city: string;
  address: string;
  total_cents: number;
  currency: string;
  status: Status;
  courier_id: string | null;
  cash_collected_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface NewOrder {
  reference?: string;
  customerName: string;
  phone: string;
  city: string;
  address: string;
  totalCents: number;
}
export interface OrderFilter {
  status?: Status;
  city?: string;
  q?: string;
  page: number;
  pageSize: number;
}
export interface Move {
  status: Status;
  courierId?: string;
  cashCollectedCents?: number;
  note?: string;
}

const COLS = "id, reference, customer_name, phone, city, address, total_cents, currency, status, courier_id, cash_collected_cents, created_at, updated_at";

@Injectable()
export class OrdersService {
  constructor(@Inject(DB) private readonly db: Db, private readonly perms: PermissionsService) {}

  async create(user: AuthUser, o: NewOrder): Promise<OrderRow> {
    return withTenant(this.db, user.tenantId, async (tx) => {
      await this.perms.require(tx, user.role, "orders:create");
      const [{ currency }] = await tx.query<{ currency: string }>("SELECT currency FROM tenants WHERE id = $1", [user.tenantId]);
      const reference = o.reference ?? `CF-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${randomBytes(3).toString("hex").toUpperCase()}`;
      try {
        const [row] = await tx.query<OrderRow>(
          `INSERT INTO orders (tenant_id, reference, customer_name, phone, city, address, total_cents, currency, created_by)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING ${COLS}`,
          [user.tenantId, reference, o.customerName, o.phone, o.city, o.address, o.totalCents, currency, user.id],
        );
        await tx.query("INSERT INTO order_events (tenant_id, order_id, from_status, to_status, actor_id) VALUES ($1,$2,NULL,'new',$3)", [user.tenantId, row.id, user.id]);
        return row;
      } catch (e: any) {
        if (e?.code === "23505") throw new ConflictException(`Reference ${reference} already exists`);
        throw e;
      }
    });
  }

  async list(user: AuthUser, f: OrderFilter) {
    return withTenant(this.db, user.tenantId, async (tx) => {
      await this.perms.require(tx, user.role, "orders:read");
      const where: string[] = [];
      const params: unknown[] = [];
      const add = (sql: string, v: unknown) => {
        params.push(v);
        where.push(sql.replaceAll("?", `$${params.length}`));
      };
      if (user.role === "courier") add("courier_id = ?", user.id);
      if (f.status) add("status = ?", f.status);
      if (f.city) add("lower(city) = lower(?)", f.city);
      if (f.q) add("(customer_name ILIKE ? OR phone ILIKE ? OR reference ILIKE ?)", `%${f.q}%`);
      const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const [{ count }] = await tx.query<{ count: string }>(`SELECT count(*) FROM orders ${clause}`, params);
      const items = await tx.query<OrderRow>(
        `SELECT ${COLS} FROM orders ${clause} ORDER BY created_at DESC, id LIMIT ${f.pageSize} OFFSET ${(f.page - 1) * f.pageSize}`,
        params,
      );
      return { items, total: Number(count), page: f.page, pageSize: f.pageSize };
    });
  }

  async get(user: AuthUser, id: string) {
    return withTenant(this.db, user.tenantId, async (tx) => {
      await this.perms.require(tx, user.role, "orders:read");
      const order = await this.load(tx, user, id, false);
      const events = await tx.query("SELECT from_status, to_status, actor_id, note, created_at FROM order_events WHERE order_id = $1 ORDER BY created_at, id", [id]);
      return { ...order, events };
    });
  }

  async move(user: AuthUser, id: string, m: Move): Promise<OrderRow> {
    return withTenant(this.db, user.tenantId, async (tx) => {
      const order = await this.load(tx, user, id, true);
      if (!canMove(order.status, m.status)) {
        throw new ConflictException(`Cannot move an order from ${order.status} to ${m.status}`);
      }
      await this.perms.require(tx, user.role, permissionFor(order.status, m.status));

      let courierId = order.courier_id;
      if (m.status === "shipped") {
        if (!m.courierId) throw new BadRequestException("courierId is required to ship an order");
        const courier = await tx.query("SELECT 1 FROM users WHERE id = $1 AND role = 'courier'", [m.courierId]);
        if (!courier.length) throw new BadRequestException("courierId is not a courier of this tenant");
        courierId = m.courierId;
      }
      let cash: number | null = order.cash_collected_cents;
      if (m.status === "delivered") {
        if (m.cashCollectedCents === undefined) throw new BadRequestException("cashCollectedCents is required to close a delivery");
        cash = m.cashCollectedCents;
      }
      const [row] = await tx.query<OrderRow>(
        `UPDATE orders SET status = $2, courier_id = $3, cash_collected_cents = $4, updated_at = now() WHERE id = $1 RETURNING ${COLS}`,
        [id, m.status, courierId, cash],
      );
      await tx.query("INSERT INTO order_events (tenant_id, order_id, from_status, to_status, actor_id, note) VALUES ($1,$2,$3,$4,$5,$6)", [
        user.tenantId,
        id,
        order.status,
        m.status,
        user.id,
        m.note ?? null,
      ]);
      return row;
    });
  }

  /** Load one order. Couriers only reach orders assigned to them. */
  private async load(tx: Tx, user: AuthUser, id: string, lock: boolean): Promise<OrderRow> {
    const [row] = await tx.query<OrderRow>(`SELECT ${COLS} FROM orders WHERE id = $1 ${lock ? "FOR UPDATE" : ""}`, [id]);
    if (!row) throw new NotFoundException("Order not found");
    if (user.role === "courier" && row.courier_id !== user.id) throw new ForbiddenException("This order is not assigned to you");
    return row;
  }
}
