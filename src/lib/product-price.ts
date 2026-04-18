import type { Product } from "@/server/schemas/catalog";

export function formatProductPrice(
  amountMinor: string | undefined,
  locale: string,
  currency: string = "CHF",
): string {
  if (!amountMinor) return "-";
  const value = Number(amountMinor) / 100;
  if (!Number.isFinite(value)) return "-";
  return new Intl.NumberFormat(locale, { style: "currency", currency }).format(value);
}

export type ProductPromotionInfo = {
  onSale: boolean;
  currentMinor: string | undefined;
  regularMinor: string | undefined;
  currency: string;
};

export function getProductPromotionInfo(product: Product): ProductPromotionInfo {
  const prices = product.prices;
  const current = prices?.price;
  const regular = prices?.regular_price;
  const currency = prices?.currency_code?.toUpperCase() || "CHF";
  const regularNumber = regular !== undefined ? Number(regular) : Number.NaN;
  const currentNumber = current !== undefined ? Number(current) : Number.NaN;
  const onSale =
    Number.isFinite(regularNumber) &&
    Number.isFinite(currentNumber) &&
    regularNumber > currentNumber;
  return { onSale, currentMinor: current, regularMinor: regular, currency };
}
