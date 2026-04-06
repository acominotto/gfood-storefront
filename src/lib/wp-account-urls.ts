/** French WooCommerce “My account” lost-password permalink. */
export function buildWooAccountLostPasswordUrl(wpBaseUrl: string): string {
  const base = wpBaseUrl.replace(/\/$/, "");
  return `${base}/mon-compte/lost-password/`;
}
