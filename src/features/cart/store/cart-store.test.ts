/**
 * Manual QA matrix (not automated here; use `/en` for stable English strings):
 * 2. Hard refresh checkout after add — cart persists (cookies).
 * 3. Open checkout immediately after add — no silent empty cart.
 * 4. Two tabs: add in A, refresh checkout in B — shared cookies.
 * 5. Guest vs sign-in on checkout — cart merge behavior.
 * 6. `pnpm build && pnpm start` — repeat 1 and 3 (no Strict Mode double-effect in prod).
 * 7. Repeat flow on another locale prefix.
 *
 * E2E: `E2E_BASE_URL=http://127.0.0.1:3000 pnpm test:e2e` (dev server + Woo env required).
 */
import { describe, expect, it } from "vitest";
import type { CartResponse } from "@/server/schemas/cart";
import { getCartItemsCount } from "./cart-store";

/** Minimal cart-shaped objects for checkout “had items” / restore logic. */
function cartLike(partial: Partial<CartResponse> & { items: CartResponse["items"] }): CartResponse {
  return partial as CartResponse;
}

describe("getCartItemsCount", () => {
  it("returns 0 for null", () => {
    expect(getCartItemsCount(null)).toBe(0);
  });

  it("sums line quantities when items are present", () => {
    const cart = cartLike({
      items: [
        { key: "a", id: 1, quantity: 2, name: "A", images: [] },
        { key: "b", id: 2, quantity: 1, name: "B", images: [] },
      ],
    });
    expect(getCartItemsCount(cart)).toBe(3);
  });

  /**
   * If Woo ever returns items_count > 0 with an empty items array, checkout restore must still
   * treat the first bootstrap snapshot as “had items” (narrow-root-cause: not only empty-empty session).
   */
  it("falls back to items_count when items is empty", () => {
    const cart = cartLike({ items: [], items_count: 2 });
    expect(getCartItemsCount(cart)).toBe(2);
  });

  it("returns 0 when items empty and items_count missing", () => {
    const cart = cartLike({ items: [] });
    expect(getCartItemsCount(cart)).toBe(0);
  });
});

describe("checkout cart empty classification (support)", () => {
  it("both fetches empty: hadItems false — restore does not run", () => {
    const first = cartLike({ items: [] });
    const latest = cartLike({ items: [] });
    expect(getCartItemsCount(first) > 0).toBe(false);
    expect(getCartItemsCount(latest) === 0).toBe(true);
  });

  it("first full second empty: hadItems true — restore may run", () => {
    const first = cartLike({
      items: [{ key: "k", id: 1, quantity: 1, name: "P", images: [] }],
    });
    const latest = cartLike({ items: [] });
    expect(getCartItemsCount(first) > 0).toBe(true);
    expect(getCartItemsCount(latest) === 0).toBe(true);
  });
});
