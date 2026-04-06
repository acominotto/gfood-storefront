import { env } from "@/lib/env";

export function resolveWooStoreBaseUrl(wpBaseUrl: string, wooStoreApiBasePath: string): string {
  return new URL(wooStoreApiBasePath, wpBaseUrl).toString();
}

/** WooCommerce Store API base (`WP_BASE_URL` + `WOO_STORE_API_BASE`). */
export function getWooStoreBaseUrl(): string {
  return resolveWooStoreBaseUrl(env.WP_BASE_URL, env.WOO_STORE_API_BASE);
}
