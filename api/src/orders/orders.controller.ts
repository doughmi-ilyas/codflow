import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query, Req } from "@nestjs/common";
import { z } from "zod";
import { parse } from "../common/validate";
import { Requires } from "../permissions/permission.guard";
import { OrdersService } from "./orders.service";
import { STATUSES } from "./status";

const phone = z.string().regex(/^(\+212|0)[5-7]\d{8}$/, "Moroccan phone number expected, e.g. 0612345678 or +212612345678");

const createSchema = z.object({
  reference: z.string().min(3).max(40).regex(/^[A-Za-z0-9-]+$/).optional(),
  customerName: z.string().trim().min(2).max(120),
  phone,
  city: z.string().trim().min(2).max(80),
  address: z.string().trim().min(5).max(300),
  totalCents: z.number().int().min(0).max(100_000_000),
});
const listSchema = z.object({
  status: z.enum(STATUSES).optional(),
  city: z.string().max(80).optional(),
  q: z.string().max(80).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
const moveSchema = z.object({
  status: z.enum(STATUSES),
  courierId: z.string().uuid().optional(),
  cashCollectedCents: z.number().int().min(0).optional(),
  note: z.string().max(300).optional(),
});

@Controller("orders")
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  @Post()
  @Requires("orders:create")
  create(@Req() req: any, @Body() body: unknown) {
    return this.orders.create(req.user, parse(createSchema, body));
  }

  @Get()
  @Requires("orders:read")
  list(@Req() req: any, @Query() query: unknown) {
    return this.orders.list(req.user, parse(listSchema, query));
  }

  @Get(":id")
  @Requires("orders:read")
  get(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string) {
    return this.orders.get(req.user, id);
  }

  @Patch(":id/status")
  @Requires("orders:read")
  move(@Req() req: any, @Param("id", new ParseUUIDPipe()) id: string, @Body() body: unknown) {
    return this.orders.move(req.user, id, parse(moveSchema, body));
  }
}
