import { describe, expect, it } from "vitest";
import {
  parseProductSegment,
  productHrefFromCartLineItem,
  productHrefFromOrderLineItem,
  productPath,
  productSegment,
  productSegmentTail,
  segmentsMatchCanonical,
} from "./product-url";

describe("parseProductSegment", () => {
  it("parses id and slug tail", () => {
    expect(parseProductSegment("123-organic-tea")).toEqual({
      id: 123,
      slugTail: "organic-tea",
    });
  });

  it("parses slug tail with multiple hyphens", () => {
    expect(parseProductSegment("42-a-b-c")).toEqual({
      id: 42,
      slugTail: "a-b-c",
    });
  });

  it("decodes percent-encoded segment", () => {
    expect(parseProductSegment("1-caf%C3%A9")).toEqual({
      id: 1,
      slugTail: "café",
    });
  });

  it("returns null when missing numeric id prefix", () => {
    expect(parseProductSegment("organic-tea")).toBeNull();
  });

  it("returns null when slug tail is empty", () => {
    expect(parseProductSegment("99-")).toBeNull();
  });

  it("returns null for id only", () => {
    expect(parseProductSegment("99")).toBeNull();
  });
});

describe("productSegment and path", () => {
  it("builds segment from Woo slug", () => {
    expect(productSegment({ id: 7, slug: "red-pepper" })).toBe("7-red-pepper");
    expect(productSegmentTail({ slug: "x" })).toBe("x");
  });

  it("builds path", () => {
    expect(productPath({ id: 1, slug: "tea" })).toBe("/p/1-tea");
  });
});

describe("segmentsMatchCanonical", () => {
  it("matches Woo slug", () => {
    expect(segmentsMatchCanonical("foo", { slug: "foo" })).toBe(true);
    expect(segmentsMatchCanonical("bar", { slug: "foo" })).toBe(false);
  });
});

describe("productHrefFromCartLineItem", () => {
  it("builds path from absolute permalink", () => {
    expect(
      productHrefFromCartLineItem({
        id: 12,
        permalink: "https://g-food.ch/produit/organic-honey/",
      }),
    ).toBe("/p/12-organic-honey");
  });

  it("handles trailing slash and path-only permalink", () => {
    expect(productHrefFromCartLineItem({ id: 3, permalink: "/shop/foo-bar" })).toBe("/p/3-foo-bar");
  });

  it("returns null without permalink", () => {
    expect(productHrefFromCartLineItem({ id: 1 })).toBeNull();
  });
});

describe("productHrefFromOrderLineItem", () => {
  it("uses product_id and permalink", () => {
    expect(
      productHrefFromOrderLineItem({
        product_id: 12,
        permalink: "https://g-food.ch/produit/organic-honey/",
      }),
    ).toBe("/p/12-organic-honey");
  });

  it("prefers variation_id when positive", () => {
    expect(
      productHrefFromOrderLineItem({
        product_id: 1,
        variation_id: 99,
        permalink: "/shop/variation-slug",
      }),
    ).toBe("/p/99-variation-slug");
  });

  it("returns null without permalink", () => {
    expect(productHrefFromOrderLineItem({ product_id: 5 })).toBeNull();
  });
});
