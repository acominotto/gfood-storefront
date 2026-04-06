import { describe, expect, it } from "vitest";
import type { Product } from "@/server/schemas/catalog";
import { productOrigineAndRegimeTerms } from "./regime-attribute";

describe("productOrigineAndRegimeTerms", () => {
  it("reads pa_origine and pa_regime terms", () => {
    const product = {
      id: 1,
      name: "Test",
      slug: "test",
      images: [],
      categories: [],
      akwaraId: null,
      attributes: [
        {
          taxonomy: "pa_origine",
          terms: [{ name: "Suisse", slug: "suisse" }],
        },
        {
          taxonomy: "pa_regime",
          terms: [
            { name: "Halal", slug: "halal" },
            { name: "Sans gluten", slug: "sans-gluten" },
          ],
        },
      ],
    } as unknown as Product;

    expect(productOrigineAndRegimeTerms(product)).toEqual({
      origine: [{ name: "Suisse", slug: "suisse" }],
      regime: [
        { name: "Halal", slug: "halal" },
        { name: "Sans gluten", slug: "sans-gluten" },
      ],
    });
  });
});
