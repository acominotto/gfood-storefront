import type { CartResponse } from "@/server/schemas/cart";

export type CartLineItem = NonNullable<CartResponse["items"]>[number];

export function formatCartMoney(
  amount: string | null | undefined,
  currency: string | null | undefined,
  locale: string,
): string {
  if (amount == null || amount === "") {
    return "-";
  }
  const value = Number(amount) / 100;
  if (!Number.isFinite(value)) {
    return "-";
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency?.toUpperCase() || "CHF",
  }).format(value);
}

export function cartItemImageProxy(item: CartLineItem): string | null {
  const image = item.images[0];
  const src = image?.thumbnail ?? image?.src;
  if (!src) {
    return null;
  }
  const path = new URL(src, "https://g-food.ch").pathname.replace(/^\//, "");
  return `/api/images/${path}?preset=thumb&q=72&fit=cover&bg=remove`;
}

/** Minor-unit string for one unit, from API `prices.price` or derived from line totals. */
export function cartItemUnitPriceMinor(item: CartLineItem): string | null {
  const p = item.prices?.price;
  if (p != null && p !== "") {
    return p;
  }
  const sub = item.prices?.line_subtotal;
  if (sub != null && sub !== "" && item.quantity > 0) {
    const subNum = Number(sub);
    if (!Number.isFinite(subNum)) {
      return null;
    }
    return String(Math.round(subNum / item.quantity));
  }
  const total = item.prices?.line_total;
  if (total != null && total !== "" && item.quantity > 0) {
    const t = Number(total);
    if (!Number.isFinite(t)) {
      return null;
    }
    return String(Math.round(t / item.quantity));
  }
  return null;
}
