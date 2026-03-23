import { revalidateTag } from "next/cache";
import { createWooClient } from "@/server/woo-client";
import { jsonError, jsonOk } from "@/server/api-response";
import { buildProductSearchParams, parseProductsQuery } from "@/server/catalog";
import { productListSchema } from "@/server/schemas/catalog";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const query = parseProductsQuery(url.searchParams);
    const woo = createWooClient();

    const requestPath = `products?${buildProductSearchParams(query).toString()}`;
    const response = await woo.get(requestPath);
    const products = productListSchema.parse(await response.json());

    revalidateTag("catalog-products", "max");

    return jsonOk(
      {
        products,
        pagination: {
          page: query.page,
          perPage: query.perPage,
          total: Number(response.headers.get("x-wp-total") ?? 0),
          totalPages: Number(response.headers.get("x-wp-totalpages") ?? 0),
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Unable to load products");
  }
}
