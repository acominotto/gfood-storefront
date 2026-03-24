import { env } from "@/lib/env";
import { jsonError } from "@/server/api-response";
import { checkRateLimit } from "@/server/rate-limit";
import { forwardWooStoreApiRequest } from "@/server/woo-store-proxy";

type Params = { params: Promise<{ path: string[] }> };

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailers",
  "transfer-encoding",
  "upgrade",
  "set-cookie",
]);

/** Node fetch decompresses gzip/deflate bodies but may still advertise Content-Encoding (and a compressed Content-Length). Forwarding those with the decoded stream breaks the browser (ERR_CONTENT_DECODING_FAILED). */
const STRIP_AFTER_FETCH_DECODE = new Set(["content-encoding", "content-length"]);

function filteredResponseHeaders(upstream: Headers) {
  const out = new Headers();
  upstream.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (!HOP_BY_HOP.has(lower) && !STRIP_AFTER_FETCH_DECODE.has(lower)) {
      out.set(key, value);
    }
  });
  return out;
}

function allowedCorsOrigin(request: Request): string | null {
  const origin = request.headers.get("Origin");
  if (!origin) {
    return null;
  }
  try {
    const allowed = new URL(env.NEXT_PUBLIC_APP_URL).origin;
    return new URL(origin).origin === allowed ? origin : null;
  } catch {
    return null;
  }
}

function applyCors(request: Request, headers: Headers) {
  const origin = allowedCorsOrigin(request);
  if (origin) {
    headers.set("Access-Control-Allow-Origin", origin);
    headers.set("Access-Control-Allow-Credentials", "true");
    headers.set("Vary", "Origin");
  }
}

async function handle(request: Request, { params }: Params) {
  const requestIp = request.headers.get("x-forwarded-for") ?? "local";
  const limiter = checkRateLimit(`woo-store:${requestIp}`);
  if (!limiter.ok) {
    return jsonError(429, "Rate limit exceeded");
  }

  try {
    const { path } = await params;
    const upstream = await forwardWooStoreApiRequest(request, path);
    const headers = filteredResponseHeaders(upstream.headers);
    applyCors(request, headers);
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers,
    });
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "WooCommerce proxy failed");
  }
}

export async function GET(request: Request, ctx: Params) {
  return handle(request, ctx);
}

export async function POST(request: Request, ctx: Params) {
  return handle(request, ctx);
}

export async function PATCH(request: Request, ctx: Params) {
  return handle(request, ctx);
}

export async function PUT(request: Request, ctx: Params) {
  return handle(request, ctx);
}

export async function DELETE(request: Request, ctx: Params) {
  return handle(request, ctx);
}

export async function OPTIONS(request: Request) {
  const headers = new Headers({
    "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Accept, Cart-Token, Nonce",
    "Access-Control-Max-Age": "86400",
  });
  applyCors(request, headers);
  return new Response(null, { status: 204, headers });
}
