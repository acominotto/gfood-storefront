import { describe, expect, it } from "vitest";
import { z } from "zod";

/** Mirrors production schema: taxonomy is the Woo Store API field (no top-level slug). */
const attributeRowSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    taxonomy: z.string(),
  })
  .passthrough();

describe("Store API products/attributes row shape", () => {
  it("accepts Woo dev payload (taxonomy only, no slug)", () => {
    const raw = [
      {
        id: 8,
        name: "Origine",
        taxonomy: "pa_origine",
        type: "select",
        order: "menu_order",
        has_archives: false,
        count: 10,
      },
      {
        id: 6,
        name: "Regime",
        taxonomy: "pa_regime",
        type: "select",
        order: "menu_order",
        has_archives: false,
        count: 3,
      },
    ];
    const parsed = z.array(attributeRowSchema).safeParse(raw);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.find((a) => a.taxonomy === "pa_origine")?.id).toBe(8);
    expect(parsed.data?.find((a) => a.taxonomy === "pa_regime")?.id).toBe(6);
  });
});
