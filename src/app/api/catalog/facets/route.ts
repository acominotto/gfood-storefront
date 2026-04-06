import { createWooClient } from "@/server/woo-client";
import { jsonError, jsonOk } from "@/server/api-response";
import {
  collectFacetTermsForTaxonomy,
  mergeTermLists,
} from "@/server/regime-attribute";
import { facetsResponseSchema, productListSchema } from "@/server/schemas/catalog";
import { fetchOrigineRegimeFacetTermsFromApi } from "@/server/woo-origine-regime-facet-terms";
import {
  WOO_ORIGINE_ATTRIBUTE_TAXONOMY,
  WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY,
} from "@/lib/woo-origine-regime";
import { getAllProductCategories } from "@/server/woo-taxonomies";

export async function GET() {
  try {
    const woo = createWooClient();

    const [categories, productsResp, fromApi] = await Promise.all([
      getAllProductCategories(),
      woo.get("products?per_page=100"),
      fetchOrigineRegimeFacetTermsFromApi(),
    ]);
    const products = productListSchema.parse(await productsResp.json());
    const origineTerms = mergeTermLists(
      fromApi.origineTerms,
      collectFacetTermsForTaxonomy(products, WOO_ORIGINE_ATTRIBUTE_TAXONOMY),
    );
    const regimeTerms = mergeTermLists(
      fromApi.regimeTerms,
      collectFacetTermsForTaxonomy(products, WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY),
    );

    const values = products
      .map((product: (typeof products)[number]) => Number(product.prices?.price ?? 0))
      .filter((price: number) => Number.isFinite(price) && price > 0);
    const min = values.length ? Math.min(...values) : 0;
    const max = values.length ? Math.max(...values) : 0;

    const payload = facetsResponseSchema.parse({
      categories,
      priceRange: { min, max },
      origineTerms,
      regimeTerms,
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
