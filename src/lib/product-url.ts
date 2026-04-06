import type { CartLineItem } from "@/lib/cart-format";
import type { Product } from "@/server/schemas/catalog";

const SEGMENT_RE = /^(\d+)-(.+)$/;

export type ParsedProductSegment = {
  id: number;
  slugTail: string;
};

/** Parse `/p/{segment}` path segment: `{id}-{slug}`. */
export function parseProductSegment(segment: string): ParsedProductSegment | null {
  let decoded = segment;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    return null;
  }
  const m = decoded.match(SEGMENT_RE);
  if (!m) {
    return null;
  }
  const id = Number(m[1]);
  const slugTail = m[2];
  if (!Number.isFinite(id) || id <= 0 || !slugTail) {
    return null;
  }
  return { id, slugTail };
}

/** Canonical URL tail after product id (WooCommerce slug). */
export function productSegmentTail(product: Pick<Product, "slug">): string {
  return product.slug;
}

/** Full dynamic segment: `{id}-{slug}`. */
export function productSegment(product: Pick<Product, "id" | "slug">): string {
  return `${product.id}-${productSegmentTail(product)}`;
}

export function productPath(product: Pick<Product, "id" | "slug">): `/p/${string}` {
  return `/p/${productSegment(product)}`;
}

/**
 * Catalog URL for a cart line when the Store API provides `permalink` (pathname tail matches product slug).
 */
/** Woo order line item fields used to build a storefront `/p/{id}-{slug}` path. */
export type OrderLineProductLinkFields = {
  product_id?: number;
  variation_id?: number | null;
  permalink?: string | null | undefined;
};

/**
 * Catalog URL for a Woo REST order line when `permalink` is present (same rules as cart lines).
 * Uses `variation_id` when set &gt; 0, otherwise `product_id`.
 */
export function productHrefFromOrderLineItem(item: OrderLineProductLinkFields): `/p/${string}` | null {
  const vid = item.variation_id ?? 0;
  const pid = item.product_id ?? 0;
  const lineProductId = typeof vid === "number" && vid > 0 ? vid : pid;
  if (!lineProductId || lineProductId <= 0) {
    return null;
  }
  const raw = item.permalink;
  if (!raw) {
    return null;
  }
  try {
    const path = new URL(raw, "https://g-food.ch").pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    const slugTail = segments[segments.length - 1];
    if (!slugTail) {
      return null;
    }
    return `/p/${lineProductId}-${slugTail}`;
  } catch {
    return null;
  }
}

export function productHrefFromCartLineItem(
  item: Pick<CartLineItem, "id"> & { permalink?: string | null | undefined },
): `/p/${string}` | null {
  const raw = item.permalink;
  if (!raw) {
    return null;
  }
  try {
    const path = new URL(raw, "https://g-food.ch").pathname.replace(/\/+$/, "");
    const segments = path.split("/").filter(Boolean);
    const slugTail = segments[segments.length - 1];
    if (!slugTail) {
      return null;
    }
    return `/p/${item.id}-${slugTail}`;
  } catch {
    return null;
  }
}

export function segmentsMatchCanonical(
  slugTailFromUrl: string,
  product: Pick<Product, "slug">,
): boolean {
  return slugTailFromUrl === productSegmentTail(product);
}
