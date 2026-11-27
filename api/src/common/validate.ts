import { BadRequestException } from "@nestjs/common";
import { ZodType } from "zod";

/** Parse untrusted input with a zod schema; failures become a 400 with the list of problems. */
export function parse<T>(schema: ZodType<T>, input: unknown): T {
  const r = schema.safeParse(input);
  if (!r.success) {
    throw new BadRequestException({
      message: "Validation failed",
      issues: r.error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
    });
  }
  return r.data;
}
