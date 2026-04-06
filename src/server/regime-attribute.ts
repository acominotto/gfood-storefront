import type { RegimeTerm } from "@/lib/regime-term";
import {
  WOO_ORIGINE_ATTRIBUTE_TAXONOMY,
  WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY,
  wooAttributeSlugBare,
} from "@/lib/woo-origine-regime";
import type { Product } from "@/server/schemas/catalog";

export { WOO_ORIGINE_ATTRIBUTE_TAXONOMY, WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY };

/**
 * Terms for one global attribute taxonomy on a Store API product.
 */
export function termsForAttributeTaxonomyFromProduct(
  product: Product,
  taxonomy: string,
): RegimeTerm[] {
  const attrs = product.attributes;
  if (!Array.isArray(attrs)) {
    return [];
  }
  const bare = wooAttributeSlugBare(taxonomy);

  for (const raw of attrs) {
    if (!raw || typeof raw !== "object") {
      continue;
    }
    const a = raw as Record<string, unknown>;
    const tax = typeof a.taxonomy === "string" ? a.taxonomy : null;
    const slug = typeof a.slug === "string" ? a.slug : null;
    const matches =
      tax === taxonomy ||
      slug === taxonomy ||
      slug === bare ||
      (taxonomy.startsWith("pa_") && slug === taxonomy.slice(3));

    if (!matches) {
      continue;
    }

    const terms = a.terms;
    if (Array.isArray(terms)) {
      const out: RegimeTerm[] = [];
      for (const t of terms) {
        if (!t || typeof t !== "object") {
          continue;
        }
        const o = t as Record<string, unknown>;
        const name = typeof o.name === "string" ? o.name : "";
        const termSlug = typeof o.slug === "string" ? o.slug : "";
        if (name || termSlug) {
          out.push({ name: name || termSlug, slug: termSlug || name });
        }
      }
      if (out.length > 0) {
        return out;
      }
    }

    const options = a.options;
    if (Array.isArray(options)) {
      return options
        .filter((o): o is string => typeof o === "string" && o.trim() !== "")
        .map((o) => ({ name: o, slug: o }));
    }
  }

  return [];
}

export function origineTermsFromProduct(product: Product): RegimeTerm[] {
  return termsForAttributeTaxonomyFromProduct(product, WOO_ORIGINE_ATTRIBUTE_TAXONOMY);
}

export function regimeDietTermsFromProduct(product: Product): RegimeTerm[] {
  return termsForAttributeTaxonomyFromProduct(product, WOO_REGIME_DIET_ATTRIBUTE_TAXONOMY);
}

export function productOrigineAndRegimeTerms(product: Product): {
  origine: RegimeTerm[];
  regime: RegimeTerm[];
} {
  return {
    origine: origineTermsFromProduct(product),
    regime: regimeDietTermsFromProduct(product),
  };
}

export function collectFacetTermsForTaxonomy(
  products: Product[],
  taxonomy: string,
): RegimeTerm[] {
  const bySlug = new Map<string, RegimeTerm>();
  for (const p of products) {
    for (const term of termsForAttributeTaxonomyFromProduct(p, taxonomy)) {
      if (!bySlug.has(term.slug)) {
        bySlug.set(term.slug, term);
      }
    }
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function mergeTermLists(fromApi: RegimeTerm[], fromProducts: RegimeTerm[]): RegimeTerm[] {
  const map = new Map<string, RegimeTerm>();
  for (const t of fromProducts) {
    map.set(t.slug, t);
  }
  for (const t of fromApi) {
    map.set(t.slug, t);
  }
  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}
