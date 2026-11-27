import { DynamicModule, Module } from "@nestjs/common";
import { AuthController } from "./auth/auth.controller";
import { AuthGuard } from "./auth/auth.guard";
import { AuthService } from "./auth/auth.service";
import { CONFIG, DB } from "./common/tokens";
import { Config } from "./config";
import { Db } from "./db/db";
import { HealthController } from "./health.controller";

@Module({})
export class AppModule {
  static register(db: Db, config: Config): DynamicModule {
    return {
      module: AppModule,
      controllers: [HealthController, AuthController],
      // useFactory, not useValue: Nest serialises useValue providers to hash the module, which fails on a big object like a database handle.
      providers: [{ provide: DB, useFactory: () => db }, { provide: CONFIG, useFactory: () => config }, AuthService, AuthGuard],
    };
  }
}
