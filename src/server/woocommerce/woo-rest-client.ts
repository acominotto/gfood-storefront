import { env } from "@/lib/env";
import { getWpRestBaseUrl } from "@/lib/wp-rest-url";
import { createHttpClient } from "@/server/http";

export function hasWooRestCredentials(): boolean {
  return Boolean(env.WOO_CONSUMER_KEY?.trim() && env.WOO_CONSUMER_SECRET?.trim());
}

/** WooCommerce REST API (`wc/v3/...`) with consumer key/secret. */
export function createWooRestClient() {
  const ck = env.WOO_CONSUMER_KEY!.trim();
  const cs = env.WOO_CONSUMER_SECRET!.trim();
  const credentials = Buffer.from(`${ck}:${cs}`, "utf8").toString("base64");
  return createHttpClient(getWpRestBaseUrl(), `Basic ${credentials}`);
}
