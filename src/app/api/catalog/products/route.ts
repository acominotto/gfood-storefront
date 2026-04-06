import { HTTPError } from "ky";
import { ZodError } from "zod";
import { formatWooHttpError } from "@/lib/woo-http-error";
import { jsonError, jsonOk } from "@/server/api-response";
import { fetchCachedCatalogProductList } from "@/server/cached-catalog-product-list";
import { parseProductsQuery } from "@/server/parse-products-query";
import type { ProductsQuery } from "@/server/schemas/catalog";

export async function GET(request: Request) {
  const url = new URL(request.url);
  let query: ProductsQuery;
  try {
    query = parseProductsQuery(url.searchParams);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid query parameters";
    return jsonError(400, message);
  }

  try {
    const { products, total, totalPages } = await fetchCachedCatalogProductList(query);

    return jsonOk(
      {
        products,
        pagination: {
          page: query.page,
          perPage: query.perPage,
          total,
          totalPages,
        },
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300",
        },
      },
    );
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(
        502,
        "Product payload from the store did not match the expected shape. Check server logs or relax schema if Woo changed.",
      );
    }
    if (error instanceof HTTPError) {
      const message = await formatWooHttpError(error);
      const upstream = error.response.status;
      const status = upstream >= 500 ? upstream : 502;
      return jsonError(status, message);
    }
    return jsonError(500, error instanceof Error ? error.message : "Unable to load products");
  }
}
