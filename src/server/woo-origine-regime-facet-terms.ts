import { z } from "zod";
import { createWooClient } from "@/server/woo-client";
import type { RegimeTerm } from "@/lib/regime-term";
import { WOO_ORIGINE_ATTRIBUTE_TAXONOMY, WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY } from "@/lib/woo-origine-regime";

/**
 * Store API `GET products/attributes` items expose `taxonomy` as the registered taxonomy name
 * (e.g. `pa_origine`). There is no separate `slug` field — requiring `slug` caused Zod to reject
 * the whole list and left facet term lists empty.
 *
 * @see Woo `ProductAttributeSchema::get_item_response`
 */
const attributeRowSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    taxonomy: z.string(),
  })
  .passthrough();

const termRowSchema = z
  .object({
    id: z.number(),
    name: z.string(),
    slug: z.string().optional(),
  })
  .passthrough()
  .transform((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug ?? String(t.id),
  }));

async function fetchTermsForAttributeId(woo: ReturnType<typeof createWooClient>, id: number): Promise<RegimeTerm[]> {
  const terms: RegimeTerm[] = [];
  let page = 1;

  for (;;) {
    try {
      const res = await woo.get(
        `products/attributes/${id}/terms?per_page=100&page=${page}&hide_empty=false`,
      );
      const batch: unknown = await res.json();
      const parsed = z.array(termRowSchema).safeParse(batch);
      if (!parsed.success || parsed.data.length === 0) {
        break;
      }
      for (const t of parsed.data) {
        terms.push({ slug: t.slug, name: t.name });
      }
      if (parsed.data.length < 100) {
        break;
      }
      page += 1;
    } catch {
      break;
    }
  }

  return terms.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Loads facet terms for `pa_origine` and `pa_regime` from the Store API.
 */
export async function fetchOrigineRegimeFacetTermsFromApi(): Promise<{
  origineTerms: RegimeTerm[];
  regimeTerms: RegimeTerm[];
}> {
  const woo = createWooClient();

  let attributesJson: unknown;
  try {
    const res = await woo.get("products/attributes?per_page=100");
    attributesJson = await res.json();
  } catch {
    return { origineTerms: [], regimeTerms: [] };
  }

  const attrsParsed = z.array(attributeRowSchema).safeParse(attributesJson);
  if (!attrsParsed.success) {
    return { origineTerms: [], regimeTerms: [] };
  }

  const origineRow = attrsParsed.data.find((a) => a.taxonomy === WOO_ORIGINE_ATTRIBUTE_TAXONOMY);
  const regimeRow = attrsParsed.data.find((a) => a.taxonomy === WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY);

  const [origineTerms, regimeTerms] = await Promise.all([
    origineRow ? fetchTermsForAttributeId(woo, origineRow.id) : Promise.resolve([]),
    regimeRow ? fetchTermsForAttributeId(woo, regimeRow.id) : Promise.resolve([]),
  ]);

  return { origineTerms, regimeTerms };
}
