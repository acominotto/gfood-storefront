import type { CartResponse } from "@/server/schemas/cart";

export type CartLineItem = NonNullable<CartResponse["items"]>[number];
export type CartFeeLine = NonNullable<CartResponse["fees"]>[number];

/** Decode numeric/named HTML entities in WooCommerce / API product names. */
export function decodeHtmlEntities(text: string): string {
  if (!text) {
    return text;
  }
  return text
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(Number(d)))
    .replace(/&nbsp;/gi, "\u00a0")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&amp;/gi, "&");
}

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

/**
 * Line total in minor units for display: prefers Store API `line_total`, then `line_subtotal`,
 * otherwise `unit price × quantity` when a unit price can be resolved.
 */
export function cartItemLineTotalMinor(item: CartLineItem): string | null {
  const lt = item.prices?.line_total;
  if (lt != null && lt !== "") {
    const n = Number(lt);
    if (Number.isFinite(n)) {
      return lt;
    }
  }
  const sub = item.prices?.line_subtotal;
  if (sub != null && sub !== "") {
    const n = Number(sub);
    if (Number.isFinite(n)) {
      return sub;
    }
  }
  const unit = cartItemUnitPriceMinor(item);
  if (unit != null && item.quantity > 0) {
    const u = Number(unit);
    if (Number.isFinite(u)) {
      return String(Math.round(u * item.quantity));
    }
  }
  return null;
}
