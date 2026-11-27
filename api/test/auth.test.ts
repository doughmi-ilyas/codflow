import { INestApplication } from "@nestjs/common";
import request from "supertest";
import { createApp } from "../src/app";
import { Config } from "../src/config";
import { Db } from "../src/db/db";
import { provisionTenant } from "../src/tenants";
import { freshDb } from "./helpers";

const config: Config = { PORT: 0, DATABASE_URL: "unused", JWT_SECRET: "test-secret-test-secret", JWT_TTL_SECONDS: 3600 };
let db: Db;
let app: INestApplication;

beforeAll(async () => {
  db = await freshDb();
  await provisionTenant(db, { slug: "shop-a", name: "Shop A", owner: { email: "Owner@A.test", password: "correct-horse-1", fullName: "Owner A" } });
  app = await createApp(db, config);
  await app.init();
});
afterAll(async () => {
  await app.close();
  await db.close();
});

const login = (body: object) => request(app.getHttpServer()).post("/auth/login").send(body);

describe("auth", () => {
  it("health check works", async () => {
    const r = await request(app.getHttpServer()).get("/health");
    expect(r.status).toBe(200);
    expect(r.body).toEqual({ status: "ok" });
  });

  it("logs in and returns a token that identifies the user", async () => {
    const r = await login({ tenant: "shop-a", email: "owner@a.test", password: "correct-horse-1" });
    expect(r.status).toBe(200);
    expect(r.body.user.role).toBe("owner");
    const me = await request(app.getHttpServer()).get("/auth/me").set("Authorization", `Bearer ${r.body.token}`);
    expect(me.status).toBe(200);
    expect(me.body.role).toBe("owner");
  });

  it("rejects a wrong password, an unknown user and an unknown tenant with the same answer", async () => {
    const bad = [
      await login({ tenant: "shop-a", email: "owner@a.test", password: "wrong" }),
      await login({ tenant: "shop-a", email: "nobody@a.test", password: "correct-horse-1" }),
      await login({ tenant: "no-such-shop", email: "owner@a.test", password: "correct-horse-1" }),
    ];
    for (const r of bad) {
      expect(r.status).toBe(401);
      expect(r.body.message).toBe("Invalid credentials");
    }
  });

  it("rejects malformed input with 400", async () => {
    const r = await login({ tenant: "shop-a", email: "not-an-email" });
    expect(r.status).toBe(400);
  });

  it("protects routes: no token, garbage token", async () => {
    expect((await request(app.getHttpServer()).get("/auth/me")).status).toBe(401);
    expect((await request(app.getHttpServer()).get("/auth/me").set("Authorization", "Bearer garbage")).status).toBe(401);
  });
});
