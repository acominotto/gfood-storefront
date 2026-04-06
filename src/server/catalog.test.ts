import { describe, expect, it } from "vitest";
import { parseProductsQuery } from "./parse-products-query";
import { appendStoreApiAttributeFilters } from "./store-api-product-filters";
import { buildProductSearchParams } from "./catalog";

describe("parseProductsQuery", () => {
  it("collects repeated regime slugs", () => {
    const q = parseProductsQuery(new URLSearchParams("regime=halal&regime=vegan"));
    expect(q.regime).toEqual(["halal", "vegan"]);
  });

  it("collects origine and regime separately", () => {
    const q = parseProductsQuery(new URLSearchParams("origine=ch&regime=vegan"));
    expect(q.origine).toEqual(["ch"]);
    expect(q.regime).toEqual(["vegan"]);
  });
});

describe("appendStoreApiAttributeFilters", () => {
  it("sets one attribute group", () => {
    const params = new URLSearchParams();
    appendStoreApiAttributeFilters(params, [{ taxonomy: "pa_regime", slugs: ["vegan"] }]);
    expect(params.get("attributes[0][attribute]")).toBe("pa_regime");
    expect(params.get("attributes[0][slug][0]")).toBe("vegan");
    expect(params.get("attribute_relation")).toBeNull();
  });

  it("uses AND across two attribute groups", () => {
    const params = new URLSearchParams();
    appendStoreApiAttributeFilters(params, [
      { taxonomy: "pa_origine", slugs: ["ch"] },
      { taxonomy: "pa_regime", slugs: ["vegan"] },
    ]);
    expect(params.get("attributes[0][attribute]")).toBe("pa_origine");
    expect(params.get("attributes[1][attribute]")).toBe("pa_regime");
    expect(params.get("attribute_relation")).toBe("and");
  });
});

describe("buildProductSearchParams", () => {
  it("includes both taxonomies when origine and regime are set", () => {
    const params = buildProductSearchParams({
      page: 1,
      perPage: 12,
      orderBy: "title",
      order: "asc",
      origine: ["ch"],
      regime: ["vegan"],
    });
    expect(params.get("attributes[0][attribute]")).toBe("pa_origine");
    expect(params.get("attributes[0][slug][0]")).toBe("ch");
    expect(params.get("attributes[1][attribute]")).toBe("pa_regime");
    expect(params.get("attributes[1][slug][0]")).toBe("vegan");
    expect(params.get("attribute_relation")).toBe("and");
  });
});
