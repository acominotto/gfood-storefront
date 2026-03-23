import { env } from "@/lib/env";
import { getWooSessionHeaders, persistWooSessionHeaders } from "@/server/woo-client";

const SEGMENT_RE = /^[a-zA-Z0-9._-]+$/;

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
  await persistWooSessionHeaders(response.headers);
  return response;
}
