import { describe, expect, it } from "vitest";
import { resolveWooStoreBaseUrl } from "@/lib/woo-store-url";

describe("resolveWooStoreBaseUrl", () => {
  it("resolves Store API path against WP base", () => {
    expect(resolveWooStoreBaseUrl("https://shop.test", "/wp-json/wc/store/v1")).toBe(
      "https://shop.test/wp-json/wc/store/v1",
    );
  });
});
