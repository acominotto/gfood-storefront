import { describe, expect, it } from "vitest";
import { resolveWpRestBaseUrl } from "@/lib/wp-rest-url";

describe("resolveWpRestBaseUrl", () => {
  it("resolves WP REST prefix against WP base", () => {
    expect(resolveWpRestBaseUrl("https://example.com", "/wp-json")).toBe("https://example.com/wp-json");
  });
});
