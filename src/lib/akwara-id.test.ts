import { describe, expect, it } from "vitest";
import { akwaraIdFromWooProduct } from "./akwara-id";

describe("akwaraIdFromWooProduct", () => {
  it("reads flat extensions key", () => {
    expect(
      akwaraIdFromWooProduct({
        extensions: { akwara_id: "AK-001" },
      }),
    ).toBe("AK-001");
  });

  it("reads nested extensions", () => {
    expect(
      akwaraIdFromWooProduct({
        extensions: { custom: { akwaraId: "42" } },
      }),
    ).toBe("42");
  });

  it("reads attribute slug pa_akwara", () => {
    expect(
      akwaraIdFromWooProduct({
        attributes: [{ slug: "pa_akwara", options: ["SKU-9"] }],
      }),
    ).toBe("SKU-9");
  });

  it("returns undefined when absent", () => {
    expect(akwaraIdFromWooProduct({})).toBeUndefined();
  });
});
