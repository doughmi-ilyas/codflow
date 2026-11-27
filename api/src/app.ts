import "reflect-metadata";
import { INestApplication } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Config } from "./config";
import { Db } from "./db/db";

export async function createApp(db: Db, config: Config): Promise<INestApplication> {
  const app = await NestFactory.create(AppModule.register(db, config), { logger: ["error", "warn"] });
  app.enableCors({ origin: process.env.CORS_ORIGIN?.split(",") ?? false });
  return app;
}
