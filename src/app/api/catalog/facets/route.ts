import { createWooClient } from "@/server/woo-client";
import { jsonError, jsonOk } from "@/server/api-response";
import { facetsResponseSchema, productListSchema } from "@/server/schemas/catalog";
import { getAllProductCategories } from "@/server/woo-taxonomies";

export async function GET() {
  try {
    const woo = createWooClient();

    const [categories, productsResp] = await Promise.all([
      getAllProductCategories(),
      woo.get("products?per_page=100"),
    ]);
    const products = productListSchema.parse(await productsResp.json());

    const values = products
      .map((product: (typeof products)[number]) => Number(product.prices?.price ?? 0))
      .filter((price: number) => Number.isFinite(price) && price > 0);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;

    const payload = facetsResponseSchema.parse({
      categories,
      priceRange: { min, max },
    });

    return jsonOk(payload, {
      headers: {
        "Cache-Control": "public, s-maxage=600, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Unable to load facets");
  }
}
