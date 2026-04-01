import { createWooClient } from "@/server/woo-client";
import { jsonOk } from "@/server/api-response";
import {
  catalogSuggestQuerySchema,
  catalogSuggestResponseSchema,
  type CatalogSuggestItem,
  suggestCategoryRowSchema,
  suggestProductRowSchema,
} from "@/server/schemas/catalog-suggest";
import { z } from "zod";

const PER_PAGE = 8;

const productListSchema = z.array(suggestProductRowSchema);
const categoryListSchema = z.array(suggestCategoryRowSchema);

function parseSuggestQuery(url: URL): z.infer<typeof catalogSuggestQuerySchema> | null {
  const raw = url.searchParams.get("q")?.trim() ?? "";
  if (raw.length === 0) {
    return null;
  }
  const parsed = catalogSuggestQuerySchema.safeParse({ q: raw });
  return parsed.success ? parsed.data : null;
}

function mapProducts(rows: z.infer<typeof productListSchema>): CatalogSuggestItem[] {
  return rows.map((p) => ({
    kind: "product" as const,
    id: p.id,
    slug: p.slug,
    label: p.name,
  }));
}

function mapCategories(rows: z.infer<typeof categoryListSchema>): CatalogSuggestItem[] {
  return rows.map((c) => ({
    kind: "category" as const,
    id: c.id,
    slug: c.slug,
    label: c.name,
  }));
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = parseSuggestQuery(url);
  if (!query) {
    return jsonOk(
      { items: [] satisfies CatalogSuggestItem[] },
      {
        headers: {
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
        },
      },
    );
  }

  const woo = createWooClient();
  const productParams = new URLSearchParams({
    search: query.q,
    per_page: String(PER_PAGE),
    page: "1",
    orderby: "title",
    order: "asc",
  });
  const categoryParams = new URLSearchParams({
    search: query.q,
    per_page: String(PER_PAGE),
    page: "1",
    hide_empty: "false",
  });

  const [productRes, categoryRes] = await Promise.allSettled([
    woo.get(`products?${productParams.toString()}`),
    woo.get(`products/categories?${categoryParams.toString()}`),
  ]);

  const items: CatalogSuggestItem[] = [];

  if (productRes.status === "fulfilled") {
    try {
      const json: unknown = await productRes.value.json();
      const rows = productListSchema.parse(json);
      items.push(...mapProducts(rows));
    } catch {
      /* ignore partial failure */
    }
  }

  if (categoryRes.status === "fulfilled") {
    try {
      const json: unknown = await categoryRes.value.json();
      const rows = categoryListSchema.parse(json);
      items.push(...mapCategories(rows));
    } catch {
      /* ignore partial failure */
    }
  }

  const payload = catalogSuggestResponseSchema.parse({ items });

  return jsonOk(payload, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
    },
  });
}
