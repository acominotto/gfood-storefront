import { unstable_cache } from "next/cache";
import { buildProductSearchParams } from "@/server/catalog";
import { productListSchema, type Product, type ProductsQuery } from "@/server/schemas/catalog";
import { createWooClient } from "@/server/woo-client";

/** Tag for on-demand revalidation (e.g. Woo webhook); do not call `revalidateTag` on every read. */
export const CATALOG_PRODUCTS_CACHE_TAG = "catalog-products";

export type CachedCatalogProductList = {
  products: Product[];
  total: number;
  totalPages: number;
};

export async function fetchCachedCatalogProductList(query: ProductsQuery): Promise<CachedCatalogProductList> {
  const searchParams = buildProductSearchParams(query).toString();
  return unstable_cache(
    async () => {
      const woo = createWooClient();
      const response = await woo.get(`products?${searchParams}`);
      const products = productListSchema.parse(await response.json());
      return {
        products,
        total: Number(response.headers.get("x-wp-total") ?? 0),
        totalPages: Number(response.headers.get("x-wp-totalpages") ?? 0),
      };
    },
    ["catalog-products-list", searchParams],
    { revalidate: 120, tags: [CATALOG_PRODUCTS_CACHE_TAG] },
  )();
}
