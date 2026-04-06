/** WooCommerce REST `orders[].total` is a decimal string (e.g. `"24.90"`), not minor units. */
export function formatWooOrderTotalDecimal(amount: string, currency: string, locale: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return "—";
  }
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency.trim().toUpperCase() || "CHF",
  }).format(value);
}
