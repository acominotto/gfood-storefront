import { describe, expect, it } from "vitest";
import {
  parseProductSegment,
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
