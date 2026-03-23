import { describe, expect, it } from "vitest";
import { productsQuerySchema } from "./catalog";

describe("productsQuerySchema", () => {
  it("parses defaults for pagination", () => {
    const parsed = productsQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.perPage).toBe(12);
  });

  it("rejects invalid values", () => {
    const result = productsQuerySchema.safeParse({ perPage: 999 });
    expect(result.success).toBe(false);
  });
});
