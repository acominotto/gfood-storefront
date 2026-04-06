import { unstable_cache } from "next/cache";
import { CATALOG_PRODUCTS_CACHE_TAG } from "@/server/cached-catalog-product-list";
import { createWooClient } from "@/server/woo-client";
import { categoryListSchema } from "@/server/schemas/catalog";

async function fetchAllStoreCollection(path: string) {
  const woo = createWooClient();
  const all: unknown[] = [];
  let page = 1;
  const perPage = 100;

  for (;;) {
    const search = new URLSearchParams({
      per_page: String(perPage),
      page: String(page),
      hide_empty: "false",
    });
    const response = await woo.get(`${path}?${search.toString()}`);
    const batch: unknown = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }
    all.push(...batch);
    if (batch.length < perPage) {
      break;
    }
    page += 1;
  }

  const parsed = categoryListSchema.parse(all);
  return [...parsed].sort((a, b) => a.name.localeCompare(b.name));
}

export async function getAllProductCategories() {
  return unstable_cache(
    async () => fetchAllStoreCollection("products/categories"),
    ["woo-product-categories"],
    { revalidate: 600, tags: [CATALOG_PRODUCTS_CACHE_TAG] },
  )();
}

export async function getAllProductTags() {
  return fetchAllStoreCollection("products/tags");
}
