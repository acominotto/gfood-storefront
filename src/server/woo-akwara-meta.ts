/**
 * Load Akwara (or other) product ids from WooCommerce REST API v3 `meta_data`.
 * The Store API often omits custom meta; v3 includes it when keys are exposed to the REST API.
 */

const DEFAULT_META_KEYS = ["_akwara_id", "akwara_id", "akwaraId", "akwara"];

export type WooV3ProductMetaRow = {
  id: number;
  meta_data?: { key: string; value: unknown }[];
};

export function parseAkwaraMetaKeysFromEnv(raw: string | undefined): string[] {
  const fromEnv = raw
    ?.split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return fromEnv && fromEnv.length > 0 ? fromEnv : [...DEFAULT_META_KEYS];
}

/**
 * Paginates `GET /wc/v3/products` and returns the first matching meta value per product id.
 */
export async function fetchProductMetaById(
  wpBaseUrl: string,
  consumerKey: string,
  consumerSecret: string,
  metaKeys: string[],
  options?: { timeoutMs?: number },
): Promise<Map<number, string>> {
  const keySet = new Set(metaKeys);
  const result = new Map<number, string>();
  const base = wpBaseUrl.replace(/\/$/, "");
  const timeoutMs = options?.timeoutMs ?? 30_000;
  let page = 1;

  for (;;) {
    const url = new URL(`${base}/wp-json/wc/v3/products`);
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));
    url.searchParams.set("consumer_key", consumerKey);
    url.searchParams.set("consumer_secret", consumerSecret);

    const res = await fetch(url, { signal: AbortSignal.timeout(timeoutMs) });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`WC v3 products ${res.status}: ${text.slice(0, 200)}`);
    }

    const items = (await res.json()) as WooV3ProductMetaRow[];
    if (!Array.isArray(items) || items.length === 0) {
      break;
    }

    for (const p of items) {
      if (typeof p.id !== "number") {
        continue;
      }
      for (const m of p.meta_data ?? []) {
        if (keySet.has(m.key) && m.value != null && String(m.value).trim() !== "") {
          result.set(p.id, String(m.value).trim());
          break;
        }
      }
    }

    const totalPages = Number(res.headers.get("x-wp-totalpages") ?? res.headers.get("X-WP-TotalPages") ?? 1);
    if (page >= totalPages) {
      break;
    }
    page += 1;
  }

  return result;
}
