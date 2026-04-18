import { DELIVERY_FREE_THRESHOLD_CHF } from "@/constants/delivery";
import type { CartResponse } from "@/server/schemas/cart";

export type FreeShippingProgress = {
  thresholdMinor: number;
  itemsTotalMinor: number;
  remainingMinor: number;
  unlocked: boolean;
  currency: string;
};

/**
 * Compute how far the cart is from the free-shipping threshold.
 * Uses `total_items` (items subtotal, VAT-included in the Swiss Woo config) so the
 * progress mirrors the WooCommerce free-shipping min-amount rule.
 * Returns `null` when the cart has no items or no total can be parsed.
 */
export function computeFreeShippingProgress(
  cart: CartResponse | null,
): FreeShippingProgress | null {
  if (!cart || cart.items.length === 0) {
    return null;
  }
  const raw = cart.totals?.total_items;
  if (raw == null || raw === "") {
    return null;
  }
  const itemsTotalMinor = Number(raw);
  if (!Number.isFinite(itemsTotalMinor)) {
    return null;
  }
  const thresholdMinor = DELIVERY_FREE_THRESHOLD_CHF * 100;
  const remainingMinor = Math.max(thresholdMinor - itemsTotalMinor, 0);
  return {
    thresholdMinor,
    itemsTotalMinor,
    remainingMinor,
    unlocked: itemsTotalMinor >= thresholdMinor,
    currency: cart.totals?.currency_code ?? "CHF",
  };
}
