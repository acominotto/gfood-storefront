type AttributeSlugGroup = { taxonomy: string; slugs: string[] };

/**
 * Appends WooCommerce Store API `attributes` filters.
 * OR within each attribute (`operator=in`); AND across attributes when more than one group is set (`attribute_relation=and`).
 */
export function appendStoreApiAttributeFilters(
  params: URLSearchParams,
  groups: AttributeSlugGroup[],
): void {
  const nonEmpty = groups
    .map((g) => ({
      taxonomy: g.taxonomy,
      slugs: [...new Set(g.slugs.map((s) => s.trim()).filter(Boolean))],
    }))
    .filter((g) => g.slugs.length > 0);

  nonEmpty.forEach((g, idx) => {
    params.set(`attributes[${idx}][attribute]`, g.taxonomy);
    params.set(`attributes[${idx}][operator]`, "in");
    g.slugs.forEach((slug, i) => {
      params.set(`attributes[${idx}][slug][${i}]`, slug);
    });
  });

  if (nonEmpty.length > 1) {
    params.set("attribute_relation", "and");
  }
}
