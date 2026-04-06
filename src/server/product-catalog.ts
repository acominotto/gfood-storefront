import { unstable_cache } from "next/cache";
import { cache } from "react";
import { CATALOG_PRODUCTS_CACHE_TAG } from "@/server/cached-catalog-product-list";
import { createWooClient } from "@/server/woo-client";
import { productListSchema, productSchema, type Product } from "@/server/schemas/catalog";

const SITEMAP_PER_PAGE = 100;

async function loadProductByIdFromWoo(id: number): Promise<Product | null> {
  const woo = createWooClient();
  try {
    const response = await woo.get(`products/${id}`);
    return productSchema.parse(await response.json());
  } catch {
    return null;
  }
}

/** Dedupes between `generateMetadata` and the page; `unstable_cache` shares across requests. */
export const fetchProductById = cache(async (id: number): Promise<Product | null> => {
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return unstable_cache(
    async () => loadProductByIdFromWoo(id),
    ["woo-product", String(id)],
    { revalidate: 120, tags: [CATALOG_PRODUCTS_CACHE_TAG, `woo-product-${id}`] },
  )();
});

/** All published products for sitemap (paginated against Woo). */
export async function fetchAllProductsForSitemap(): Promise<Product[]> {
  const woo = createWooClient();
  const all: Product[] = [];
  let page = 1;

  for (;;) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(SITEMAP_PER_PAGE),
      orderby: "title",
      order: "asc",
    });
    const response = await woo.get(`products?${params.toString()}`);
    const products = productListSchema.parse(await response.json());
    if (products.length === 0) {
      break;
    }
    all.push(...products);

    const totalPages = Number(response.headers.get("x-wp-totalpages") ?? 1);
    if (page >= totalPages) {
      break;
    }
    page += 1;
  }

  return all;
}
