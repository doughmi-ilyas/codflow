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
let tenantId: string;

async function addUser(role: string, email: string) {
  const hash = await bcrypt.hash("password-12345", 4);
  await db.tx((tx) => tx.query("INSERT INTO users (tenant_id, email, password_hash, full_name, role) VALUES ($1,$2,$3,$2,$4)", [tenantId, email, hash, role]));
}
async function tokenFor(email: string): Promise<string> {
  const r = await request(app.getHttpServer()).post("/auth/login").send({ tenant: "shop-a", email, password: "password-12345" });
  return r.body.token;
}

beforeAll(async () => {
  db = await freshDb();
  ({ tenantId } = await provisionTenant(db, { slug: "shop-a", name: "Shop A", owner: { email: "owner@a.test", password: "password-12345", fullName: "Owner" } }));
  await addUser("agent", "agent@a.test");
  app = await createApp(db, config);
  await app.init();
});
afterAll(async () => {
  await app.close();
  await db.close();
});

describe("permission matrix", () => {
  it("owner can read the matrix, an agent cannot", async () => {
    const owner = await tokenFor("owner@a.test");
    const agent = await tokenFor("agent@a.test");
    const ok = await request(app.getHttpServer()).get("/permissions").set("Authorization", `Bearer ${owner}`);
    expect(ok.status).toBe(200);
    expect(ok.body.matrix.courier).toContain("orders:deliver");
    const no = await request(app.getHttpServer()).get("/permissions").set("Authorization", `Bearer ${agent}`);
    expect(no.status).toBe(403);
  });

  it("owner can change a role and the change takes effect on the next request", async () => {
    const owner = await tokenFor("owner@a.test");
    const agent = await tokenFor("agent@a.test");
    const before = await request(app.getHttpServer()).get("/permissions").set("Authorization", `Bearer ${agent}`);
    expect(before.status).toBe(403);
    const put = await request(app.getHttpServer()).put("/permissions/agent").set("Authorization", `Bearer ${owner}`).send({ permissions: ["permissions:manage"] });
    expect(put.status).toBe(200);
    const after = await request(app.getHttpServer()).get("/permissions").set("Authorization", `Bearer ${agent}`);
    expect(after.status).toBe(200);
  });

  it("the owner always keeps permissions:manage", async () => {
    const owner = await tokenFor("owner@a.test");
    const put = await request(app.getHttpServer()).put("/permissions/owner").set("Authorization", `Bearer ${owner}`).send({ permissions: [] });
    expect(put.body.permissions).toEqual(["permissions:manage"]);
  });

  it("rejects unknown roles and unknown permissions", async () => {
    const owner = await tokenFor("owner@a.test");
    expect((await request(app.getHttpServer()).put("/permissions/admin").set("Authorization", `Bearer ${owner}`).send({ permissions: [] })).status).toBe(404);
    expect((await request(app.getHttpServer()).put("/permissions/agent").set("Authorization", `Bearer ${owner}`).send({ permissions: ["root"] })).status).toBe(400);
  });
});
