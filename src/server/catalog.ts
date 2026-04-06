import {
  WOO_ORIGINE_ATTRIBUTE_TAXONOMY,
  WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY,
} from "@/lib/woo-origine-regime";
import type { ProductsQuery } from "@/server/schemas/catalog";
import { appendStoreApiAttributeFilters } from "@/server/store-api-product-filters";

export { parseProductsQuery } from "@/server/parse-products-query";

export function buildProductSearchParams(query: ProductsQuery) {
  const params = new URLSearchParams({
    page: String(query.page),
    per_page: String(query.perPage),
    orderby: query.orderBy,
    order: query.order,
  });

  if (query.search) {
    params.set("search", query.search);
  }
  if (query.category) {
    params.set("category", query.category);
  }
  if (typeof query.minPrice === "number") {
    params.set("min_price", String(query.minPrice));
  }
  if (typeof query.maxPrice === "number") {
    params.set("max_price", String(query.maxPrice));
  }
  if (query.inStock) {
    params.set("stock_status", "instock");
  }

  appendStoreApiAttributeFilters(params, [
    { taxonomy: WOO_ORIGINE_ATTRIBUTE_TAXONOMY, slugs: query.origine ?? [] },
    { taxonomy: WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY, slugs: query.regime ?? [] },
  ]);

  return params;
}
