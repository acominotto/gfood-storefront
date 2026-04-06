import { describe, expect, it } from "vitest";
import { buildWooAccountLostPasswordUrl } from "@/lib/wp-account-urls";

describe("buildWooAccountLostPasswordUrl", () => {
  it("strips trailing slash on base and appends French lost-password path", () => {
    expect(buildWooAccountLostPasswordUrl("https://shop.example/")).toBe(
      "https://shop.example/mon-compte/lost-password/",
    );
  });

  it("works without trailing slash on base", () => {
    expect(buildWooAccountLostPasswordUrl("https://shop.example")).toBe(
      "https://shop.example/mon-compte/lost-password/",
    );
  });
});
