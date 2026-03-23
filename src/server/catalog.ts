import { productsQuerySchema, type ProductsQuery } from "@/server/schemas/catalog";

export function parseProductsQuery(input: URLSearchParams) {
  const parsed = productsQuerySchema.safeParse({
    search: input.get("search") ?? undefined,
    category: input.get("category") ?? undefined,
    minPrice: input.get("minPrice") ?? undefined,
    maxPrice: input.get("maxPrice") ?? undefined,
    inStock: input.get("inStock") ?? undefined,
    page: input.get("page") ?? undefined,
    perPage: input.get("perPage") ?? undefined,
    orderBy: input.get("orderBy") ?? undefined,
    order: input.get("order") ?? undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.message);
  }

  return parsed.data;
}

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

  return params;
}
