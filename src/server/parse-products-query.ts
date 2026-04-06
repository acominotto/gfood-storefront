import { productsQuerySchema, type ProductsQuery } from "@/server/schemas/catalog";

function parseMultiParam(input: URLSearchParams, key: string): string[] | undefined {
  const raw = input
    .getAll(key)
    .flatMap((s) => s.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
  const unique = [...new Set(raw)];
  return unique.length > 0 ? unique : undefined;
}

export function parseProductsQuery(input: URLSearchParams): ProductsQuery {
  const origine = parseMultiParam(input, "origine");
  const regime = parseMultiParam(input, "regime");

  const parsed = productsQuerySchema.safeParse({
    search: input.get("search") ?? undefined,
    category: input.get("category") ?? undefined,
    origine,
    regime,
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
