/**
 * WooCommerce global product attributes for origin and diet (régime).
 * Taxonomy names must match Woo (`pa_` + attribute slug from Products → Attributes).
 *
 * @see woo-dev `products/attributes` snapshot (e.g. `pa_origine`, `pa_regime`).
 */
export const WOO_ORIGINE_ATTRIBUTE_TAXONOMY = "pa_origine" as const;
export const WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY = "pa_regime" as const;

export const WOO_ORIGINE_REGIME_ATTRIBUTE_TAXONOMIES = [
  WOO_ORIGINE_ATTRIBUTE_TAXONOMY,
  WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY,
] as const;

/** Strip `pa_` prefix from a taxonomy name (e.g. product attribute `slug` fields). */
export function wooAttributeSlugBare(taxonomy: string): string {
  return taxonomy.startsWith("pa_") ? taxonomy.slice(3) : taxonomy;
}
