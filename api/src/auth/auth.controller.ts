import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import { z } from "zod";
import { parse } from "../common/validate";
import { AuthGuard } from "./auth.guard";
import { AuthService } from "./auth.service";

const loginSchema = z.object({
  tenant: z.string().min(2).max(40),
  email: z.string().email(),
  password: z.string().min(1).max(200),
});

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("login")
  @HttpCode(200)
  login(@Body() body: unknown) {
    const b = parse(loginSchema, body);
    return this.auth.login(b.tenant, b.email, b.password);
  }

  @Get("me")
  @UseGuards(AuthGuard)
  me(@Req() req: any) {
    return req.user;
  }
}
