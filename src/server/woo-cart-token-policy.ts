/**
 * When false, `persistWooSessionHeaders` must not overwrite `woo_cart_token` from this response.
 * WooCommerce `GET /checkout` can return a Cart-Token that desyncs the session so the next `GET /cart` is empty.
 */
export function shouldPersistWooCartToken(pathSegments: string[], method: string): boolean {
  const m = method.toUpperCase();
  return !(pathSegments[0] === "checkout" && m === "GET");
}
