/**
 * WooCommerce “order received” page URL (order key required for guest-style access).
 * Uses the same env as checkout success links.
 */
export function wooOrderReceivedUrl(orderId: number, orderKey: string | undefined | null): string | null {
  const base = process.env.NEXT_PUBLIC_WOO_SITE_URL?.replace(/\/$/, "");
  if (!base) {
    return null;
  }
  const key = orderKey?.trim();
  if (key) {
    return `${base}/checkout/order-received/${String(orderId)}/?key=${encodeURIComponent(key)}`;
  }
  return base;
}
