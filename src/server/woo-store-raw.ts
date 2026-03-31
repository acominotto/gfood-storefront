import { createWooClient } from "@/server/woo-client";

const PER_PAGE = 100;

export async function fetchStoreApiAllPages(
  path: string,
  options: { hideEmpty?: boolean } = {},
): Promise<unknown[]> {
  const hideEmpty = options.hideEmpty ?? false;
  const woo = createWooClient();
  const all: unknown[] = [];
  let page = 1;

  for (;;) {
    const search = new URLSearchParams({
      per_page: String(PER_PAGE),
      page: String(page),
      hide_empty: hideEmpty ? "true" : "false",
    });
    const response = await woo.get(`${path}?${search.toString()}`);
    const batch: unknown = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }
    all.push(...batch);
    if (batch.length < PER_PAGE) {
      break;
    }
    page += 1;
  }

  return all;
}

export async function fetchProductsRawWithTotals(): Promise<{
  items: unknown[];
  total: number;
  totalPages: number;
}> {
  const woo = createWooClient();
  const all: unknown[] = [];
  let page = 1;
  let total = 0;
  let totalPages = 1;

  for (;;) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PER_PAGE),
      orderby: "title",
      order: "asc",
    });
    const response = await woo.get(`products?${params.toString()}`);
    if (page === 1) {
      total = Number(response.headers.get("x-wp-total") ?? 0);
      totalPages = Number(response.headers.get("x-wp-totalpages") ?? 1);
    }
    const batch: unknown = await response.json();
    if (!Array.isArray(batch) || batch.length === 0) {
      break;
    }
    all.push(...batch);
    if (page >= totalPages) {
      break;
    }
    page += 1;
  }

  return { items: all, total, totalPages };
}

export async function tryFetchStoreApiAllPages(path: string): Promise<unknown[] | null> {
  try {
    return await fetchStoreApiAllPages(path);
  } catch {
    return null;
  }
}

export function priceRangeFromRawProducts(products: unknown[]): { min: number; max: number } {
  const values = products
    .map((product) => {
      if (!product || typeof product !== "object" || !("prices" in product)) {
        return NaN;
      }
      const prices = (product as { prices?: { price?: string } }).prices;
      return Number(prices?.price ?? 0);
    })
    .filter((price): price is number => Number.isFinite(price) && price > 0);

  if (!values.length) {
    return { min: 0, max: 0 };
  }

  return { min: Math.min(...values), max: Math.max(...values) };
}
