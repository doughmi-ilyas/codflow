import { INestApplication } from "@nestjs/common";
import bcrypt from "bcryptjs";
import request from "supertest";
import { createApp } from "../src/app";
import { Config } from "../src/config";
import { Db } from "../src/db/db";
import { provisionTenant } from "../src/tenants";
import { freshDb } from "./helpers";

const config: Config = { PORT: 0, DATABASE_URL: "unused", JWT_SECRET: "test-secret-test-secret", JWT_TTL_SECONDS: 3600 };
let db: Db;
let app: INestApplication;
const ids: Record<string, string> = {};
const tokens: Record<string, string> = {};

async function addUser(tenantId: string, role: string, email: string) {
  const hash = await bcrypt.hash("password-12345", 4);
  const [u] = await db.tx((tx) =>
    tx.query<{ id: string }>("INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1,$2,$3,$2,$4) RETURNING id", [tenantId, email, hash, role]),
  );
  ids[email] = u.id;
}
async function login(tenant: string, email: string) {
  const r = await request(app.getHttpServer()).post("/auth/login").send({ tenant, email, password: "password-12345" });
  tokens[email] = r.body.token;
}
const api = (method: "get" | "post" | "patch", url: string, who: string) => request(app.getHttpServer())[method](url).set("Authorization", `Bearer ${tokens[who]}`);

const order = (extra: object = {}) => ({ customerName: "Fatima Zahra", phone: "0612345678", city: "Casablanca", address: "12 rue des Orangers", totalCents: 25000, ...extra });

beforeAll(async () => {
  db = await freshDb();
  const a = await provisionTenant(db, { slug: "shop-a", name: "Shop A", owner: { email: "owner@a.test", password: "password-12345", fullName: "Owner A" } });
  const b = await provisionTenant(db, { slug: "shop-b", name: "Shop B", owner: { email: "owner@b.test", password: "password-12345", fullName: "Owner B" } });
  await addUser(a.tenantId, "agent", "agent@a.test");
  await addUser(a.tenantId, "manager", "manager@a.test");
  await addUser(a.tenantId, "courier", "courier1@a.test");
  await addUser(a.tenantId, "courier", "courier2@a.test");
  app = await createApp(db, config);
  await app.init();
  for (const e of ["owner@a.test", "agent@a.test", "manager@a.test", "courier1@a.test", "courier2@a.test"]) await login("shop-a", e);
  await login("shop-b", "owner@b.test");
  void b;
});
afterAll(async () => {
  await app.close();
  await db.close();
});

describe("creating and reading orders", () => {
  it("an agent creates an order that starts as new, with a history entry", async () => {
    const r = await api("post", "/orders", "agent@a.test").send(order());
    expect(r.status).toBe(201);
    expect(r.body.status).toBe("new");
    expect(r.body.currency).toBe("MAD");
    expect(r.body.reference).toMatch(/^CF-\d{8}-[0-9A-F]{6}$/);
    const g = await api("get", `/orders/${r.body.id}`, "agent@a.test");
    expect(g.body.events).toHaveLength(1);
    expect(g.body.events[0].to_status).toBe("new");
  });

  it("rejects bad input: Moroccan phone format, negative total", async () => {
    expect((await api("post", "/orders", "agent@a.test").send(order({ phone: "12345" }))).status).toBe(400);
    expect((await api("post", "/orders", "agent@a.test").send(order({ totalCents: -1 }))).status).toBe(400);
  });

  it("refuses a duplicate reference with 409", async () => {
    await api("post", "/orders", "agent@a.test").send(order({ reference: "DUP-1" }));
    const r = await api("post", "/orders", "agent@a.test").send(order({ reference: "DUP-1" }));
    expect(r.status).toBe(409);
  });

  it("lists with filters and pagination", async () => {
    for (let i = 0; i < 4; i++) await api("post", "/orders", "agent@a.test").send(order({ city: "Rabat", customerName: `Client Rabat ${i}` }));
    const all = await api("get", "/orders?pageSize=2&page=1", "manager@a.test");
    expect(all.body.items).toHaveLength(2);
    expect(all.body.total).toBeGreaterThanOrEqual(6);
    const rabat = await api("get", "/orders?city=rabat", "manager@a.test");
    expect(rabat.body.total).toBe(4);
    const q = await api("get", "/orders?q=Rabat%202", "manager@a.test");
    expect(q.body.total).toBe(1);
    expect((await api("get", "/orders?pageSize=500", "manager@a.test")).status).toBe(400);
  });

  it("another tenant sees nothing of these orders", async () => {
    const r = await api("get", "/orders", "owner@b.test");
    expect(r.body.total).toBe(0);
  });
});

describe("delivery workflow", () => {
  let id: string;
  beforeAll(async () => {
    id = (await api("post", "/orders", "agent@a.test").send(order({ reference: "FLOW-1" }))).body.id;
  });
  const move = (who: string, body: object) => api("patch", `/orders/${id}/status`, who).send(body);

  it("a courier cannot confirm; an agent can", async () => {
    expect((await move("courier1@a.test", { status: "confirmed" })).status).toBe(403);
    expect((await move("agent@a.test", { status: "confirmed" })).body.status).toBe("confirmed");
  });

  it("skipping a step is refused", async () => {
    const r = await move("manager@a.test", { status: "delivered", cashCollectedCents: 1 });
    expect(r.status).toBe(409);
  });

  it("shipping needs a real courier; an agent cannot ship", async () => {
    expect((await move("agent@a.test", { status: "shipped", courierId: ids["courier1@a.test"] })).status).toBe(403);
    expect((await move("manager@a.test", { status: "shipped" })).status).toBe(400);
    expect((await move("manager@a.test", { status: "shipped", courierId: ids["agent@a.test"] })).status).toBe(400);
    const ok = await move("manager@a.test", { status: "shipped", courierId: ids["courier1@a.test"] });
    expect(ok.body.status).toBe("shipped");
    expect(ok.body.courier_id).toBe(ids["courier1@a.test"]);
  });

  it("only the assigned courier can close the delivery, and must report the cash", async () => {
    expect((await move("courier2@a.test", { status: "delivered", cashCollectedCents: 25000 })).status).toBe(403);
    expect((await move("courier1@a.test", { status: "delivered" })).status).toBe(400);
    const done = await move("courier1@a.test", { status: "delivered", cashCollectedCents: 24000, note: "10 MAD discount" });
    expect(done.body.status).toBe("delivered");
    expect(done.body.cash_collected_cents).toBe(24000);
  });

  it("a delivered order is final, and its history is complete", async () => {
    expect((await move("owner@a.test", { status: "returned" })).status).toBe(409);
    const g = await api("get", `/orders/${id}`, "owner@a.test");
    expect(g.body.events.map((e: any) => e.to_status)).toEqual(["new", "confirmed", "shipped", "delivered"]);
  });

  it("couriers list only their own orders", async () => {
    const mine = await api("get", "/orders", "courier1@a.test");
    expect(mine.body.items.map((o: any) => o.reference)).toEqual(["FLOW-1"]);
    expect((await api("get", "/orders", "courier2@a.test")).body.total).toBe(0);
  });

  it("a refused order can only go to returned", async () => {
    const o = (await api("post", "/orders", "agent@a.test").send(order({ reference: "REF-1" }))).body.id;
    const r1 = await api("patch", `/orders/${o}/status`, "agent@a.test").send({ status: "refused", note: "customer changed mind" });
    expect(r1.body.status).toBe("refused");
    expect((await api("patch", `/orders/${o}/status`, "agent@a.test").send({ status: "confirmed" })).status).toBe(409);
    expect((await api("patch", `/orders/${o}/status`, "manager@a.test").send({ status: "returned" })).status).toBe(403);
    expect((await api("patch", `/orders/${o}/status`, "owner@a.test").send({ status: "returned" })).body.status).toBe("returned");
  });

  it("unknown ids give 404, malformed ids 400", async () => {
    expect((await api("get", "/orders/00000000-0000-4000-8000-000000000000", "owner@a.test")).status).toBe(404);
    expect((await api("get", "/orders/not-a-uuid", "owner@a.test")).status).toBe(400);
  });
});

describe("couriers list", () => {
  it("a manager sees the couriers (no password hashes), an agent is refused", async () => {
    const ok = await api("get", "/users/couriers", "manager@a.test");
    expect(ok.status).toBe(200);
    expect(ok.body.map((u: any) => u.full_name).sort()).toEqual(["courier1@a.test", "courier2@a.test"]);
    expect(JSON.stringify(ok.body)).not.toContain("password");
    expect((await api("get", "/users/couriers", "agent@a.test")).status).toBe(403);
  });
});
