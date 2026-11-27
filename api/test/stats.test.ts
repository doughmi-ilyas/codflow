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
let owner: string;
let courier: string;

beforeAll(async () => {
  db = await freshDb();
  const a = await provisionTenant(db, { slug: "shop-a", name: "Shop A", owner: { email: "owner@a.test", password: "password-12345", fullName: "Owner" } });
  const hash = await bcrypt.hash("password-12345", 4);
  const [c] = await db.tx((tx) => tx.query<{ id: string }>("INSERT INTO users (tenant_id,email,password_hash,full_name,role) VALUES ($1,'c@a.test',$2,'C','courier') RETURNING id", [a.tenantId, hash]));
  app = await createApp(db, config);
  await app.init();
  const login = async (email: string) => (await request(app.getHttpServer()).post("/auth/login").send({ tenant: "shop-a", email, password: "password-12345" })).body.token as string;
  owner = await login("owner@a.test");
  courier = await login("c@a.test");
  const mk = async (ref: string, total: number) =>
    (await request(app.getHttpServer()).post("/orders").set("Authorization", `Bearer ${owner}`).send({ reference: ref, customerName: "Client", phone: "0612345678", city: "Fès", address: "5 avenue Hassan II", totalCents: total })).body.id as string;
  const mv = (id: string, token: string, body: object) => request(app.getHttpServer()).patch(`/orders/${id}/status`).set("Authorization", `Bearer ${token}`).send(body);
  const o1 = await mk("S-1", 10000);
  const o2 = await mk("S-2", 20000);
  await mk("S-3", 5000);
  for (const id of [o1, o2]) {
    await mv(id, owner, { status: "confirmed" });
    await mv(id, owner, { status: "shipped", courierId: c.id });
  }
  await mv(o1, courier, { status: "delivered", cashCollectedCents: 9500 });
});
afterAll(async () => {
  await app.close();
  await db.close();
});

describe("stats", () => {
  it("summarises orders per status and the cash picture", async () => {
    const r = await request(app.getHttpServer()).get("/stats").set("Authorization", `Bearer ${owner}`);
    expect(r.status).toBe(200);
    expect(r.body.counts).toMatchObject({ new: 1, shipped: 1, delivered: 1, confirmed: 0 });
    expect(r.body.cash).toEqual({ deliveredTotalCents: 10000, collectedCents: 9500, differenceCents: -500, onTheRoadCents: 20000, onTheRoadOrders: 1 });
  });

  it("is not available to couriers", async () => {
    expect((await request(app.getHttpServer()).get("/stats").set("Authorization", `Bearer ${courier}`)).status).toBe(403);
  });
});
