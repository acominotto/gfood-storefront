import { describe, expect, it } from "vitest";
import { trustStorefrontBrowserRequest } from "./storefront-origin-trust";

const app = "https://shop.example.com";

function headers(record: Record<string, string>) {
  const lower = Object.fromEntries(
    Object.entries(record).map(([k, v]) => [k.toLowerCase(), v]),
  );
  return (name: string) => lower[name.toLowerCase()] ?? null;
}

describe("trustStorefrontBrowserRequest", () => {
  it("allows matching Origin", () => {
    expect(trustStorefrontBrowserRequest(headers({ origin: app }), app, "production")).toBe(true);
  });

  it("allows Referer on same origin", () => {
    expect(
      trustStorefrontBrowserRequest(headers({ referer: `${app}/fr/login` }), app, "production"),
    ).toBe(true);
  });

  it("does not accept Sec-Fetch-Site alone (trivially forgeable outside browsers)", () => {
    expect(
      trustStorefrontBrowserRequest(headers({ "sec-fetch-site": "same-origin" }), app, "production"),
    ).toBe(false);
  });

  it("rejects cross-site", () => {
    expect(
      trustStorefrontBrowserRequest(
        headers({ "sec-fetch-site": "cross-site", origin: "https://evil.test" }),
        app,
        "production",
      ),
    ).toBe(false);
  });

  it("rejects bare requests in production", () => {
    expect(trustStorefrontBrowserRequest(headers({}), app, "production")).toBe(false);
  });

  it("allows bare requests only in test env", () => {
    expect(trustStorefrontBrowserRequest(headers({}), app, "test")).toBe(true);
  });
});
