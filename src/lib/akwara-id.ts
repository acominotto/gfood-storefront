/**
 * Resolve Akwara product id from WooCommerce Store API payloads.
 * Checks `extensions` (flat + shallow nested) and product attributes (slug/name containing "akwara").
 */

export type WooProductAkwaraSource = {
  extensions?: Record<string, unknown> | undefined;
  sku?: string | undefined;
  attributes?: Record<string, unknown>[] | undefined;
};

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function scanExtensionsTree(obj: unknown, depth: number): string | undefined {
  if (depth > 2 || obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return undefined;
  }
  const o = obj as Record<string, unknown>;
  for (const [key, value] of Object.entries(o)) {
    const kl = key.toLowerCase().replace(/-/g, "_");
    if (
      (kl === "akwara_id" || kl === "akwara" || kl === "akwaraid" || kl.endsWith("_akwara_id")) &&
      value != null &&
      String(value).trim() !== ""
    ) {
      return String(value).trim();
    }
  }
  for (const value of Object.values(o)) {
    if (value !== null && typeof value === "object" && !Array.isArray(value)) {
      const found = scanExtensionsTree(value, depth + 1);
      if (found !== undefined) {
        return found;
      }
    }
  }
  return undefined;
}

function attributeAkwaraValue(attr: Record<string, unknown>): string | undefined {
  const slugRaw = attr.slug ?? attr.name;
  const slug = typeof slugRaw === "string" ? slugRaw.toLowerCase().replace(/-/g, "_") : "";
  const matchesAkwara =
    slug === "akwara" ||
    slug === "pa_akwara" ||
    slug.includes("akwara") ||
    (typeof attr.name === "string" && attr.name.toLowerCase().includes("akwara"));
  if (!matchesAkwara) {
    return undefined;
  }
  if (isNonEmptyString(attr.option)) {
    return attr.option.trim();
  }
  const options = attr.options ?? attr.terms;
  if (Array.isArray(options) && options.length > 0) {
    const first = options[0];
    if (first != null && String(first).trim() !== "") {
      return String(first).trim();
    }
  }
  return undefined;
}

export function akwaraIdFromWooProduct(source: WooProductAkwaraSource): string | undefined {
  const fromExt = source.extensions ? scanExtensionsTree(source.extensions, 0) : undefined;
  if (fromExt !== undefined) {
    return fromExt;
  }

  const attrs = source.attributes;
  if (Array.isArray(attrs)) {
    for (const raw of attrs) {
      if (raw && typeof raw === "object") {
        const v = attributeAkwaraValue(raw as Record<string, unknown>);
        if (v !== undefined) {
          return v;
        }
      }
    }
  }

  return undefined;
}
