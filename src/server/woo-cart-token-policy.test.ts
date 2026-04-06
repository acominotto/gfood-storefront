/**
 * DevTools repro (when checkout misses items after add):
 * 1. Network: POST …/api/woo/cart/add-item — confirm 2xx and cart body has line items.
 * 2. Application → Cookies: `woo_cart_token` / `woo_store_nonce` update after that response.
 * 3. On checkout load: compare two GET …/api/woo/cart responses (bootstrap fetches twice).
 *    - If both empty → session/cookie mismatch (`shouldPersistWooCartToken` prevents one desync from GET checkout).
 *    - If first has items, second empty → checkout restore path should run (see checkout-page loadBootstrap).
 */

import { describe, expect, it } from "vitest";
import { shouldPersistWooCartToken } from "./woo-cart-token-policy";

describe("shouldPersistWooCartToken", () => {
  it("does not persist cart token on GET checkout (Woo can return a mismatched Cart-Token)", () => {
    expect(shouldPersistWooCartToken(["checkout"], "GET")).toBe(false);
    expect(shouldPersistWooCartToken(["checkout"], "get")).toBe(false);
  });

  it("persists cart token on GET cart", () => {
    expect(shouldPersistWooCartToken(["cart"], "GET")).toBe(true);
  });

  it("persists cart token on POST checkout (place order / draft updates)", () => {
    expect(shouldPersistWooCartToken(["checkout"], "POST")).toBe(true);
    expect(shouldPersistWooCartToken(["checkout"], "PUT")).toBe(true);
  });

  it("persists cart token on POST cart add-item", () => {
    expect(shouldPersistWooCartToken(["cart", "add-item"], "POST")).toBe(true);
  });

  it("uses first path segment only (checkout sub-resources)", () => {
    expect(shouldPersistWooCartToken(["checkout", "x"], "GET")).toBe(false);
  });
});
