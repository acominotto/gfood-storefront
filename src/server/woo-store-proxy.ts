import { env } from "@/lib/env";
import { getWooSessionHeaders, persistWooSessionHeaders } from "@/server/woo-client";
import { shouldPersistWooCartToken } from "@/server/woo-cart-token-policy";

/** Allow `%` for percent-encoded coupon codes in paths like `cart/coupons/{code}`. */
const SEGMENT_RE = /^[a-zA-Z0-9._%-]+$/;

export function buildWooStoreUpstreamUrl(request: Request, pathSegments: string[]) {
  if (pathSegments.length === 0) {
    throw new Error("Missing Store API path");
  }
  for (const segment of pathSegments) {
    if (!segment || !SEGMENT_RE.test(segment)) {
      throw new Error("Invalid Store API path");
    }
  }

  const root = new URL(env.WOO_STORE_API_BASE, env.WP_BASE_URL);
  const basePath = root.pathname.replace(/\/$/, "");
  const suffix = pathSegments.join("/");
  const upstream = new URL(`${basePath}/${suffix}`, root.origin);
  upstream.search = new URL(request.url).search;
  return upstream;
}

/** Forwards the incoming request to the WooCommerce Store API (server-side; avoids browser CORS to WordPress). */
export async function forwardWooStoreApiRequest(request: Request, pathSegments: string[]) {
  const upstream = buildWooStoreUpstreamUrl(request, pathSegments);
  const sessionHeaders = await getWooSessionHeaders();

  const method = request.method.toUpperCase();
  const headers = new Headers();
  headers.set("Accept", "application/json");
  for (const [key, value] of Object.entries(sessionHeaders)) {
    if (value) {
      headers.set(key, value);
    }
  }

  const init: RequestInit = {
    method,
    headers,
    signal: AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS),
    /** Cart/checkout are per-session; never cache or dedupe upstream GETs in Next's fetch layer. */
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    const contentType = request.headers.get("content-type");
    if (contentType) {
      headers.set("Content-Type", contentType);
    }
    if (request.body) {
      init.body = request.body;
      Object.assign(init, { duplex: "half" as const });
    }
  }

  const response = await fetch(upstream, init);
  const persistCartToken = shouldPersistWooCartToken(pathSegments, method);
  await persistWooSessionHeaders(response.headers, { persistCartToken });
  return response;
}
