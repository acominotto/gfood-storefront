import { env } from "@/lib/env";
import { checkRateLimit } from "@/server/rate-limit";
import { jsonError } from "@/server/api-response";
import {
  processCatalogImageBuffer,
  type CatalogImageOutputFormat,
} from "@/server/catalog-image-pipeline";

type Params = { params: Promise<{ path: string[] }> };

type CachedImage = {
  body: Uint8Array;
  contentType: string;
  etag: string;
  expiresAt: number;
};

const imageCache = new Map<string, CachedImage>();
const IMAGE_PIPELINE_VERSION = "9";

function bytesToArrayBuffer(bytes: Uint8Array) {
  const start = bytes.byteOffset;
  const end = start + bytes.byteLength;
  return bytes.buffer.slice(start, end) as ArrayBuffer;
}

function chooseFormat(request: Request, explicitFormat: string | null) {
  if (explicitFormat) {
    return explicitFormat;
  }
  const accept = request.headers.get("accept") ?? "";
  if (accept.includes("image/avif")) {
    return "avif";
  }
  if (accept.includes("image/webp")) {
    return "webp";
  }
  return "jpeg";
}

function toPipelineFormat(format: string): CatalogImageOutputFormat {
  if (format === "avif") {
    return "avif";
  }
  if (format === "jpeg" || format === "jpg") {
    return format;
  }
  return "webp";
}

export async function GET(request: Request, { params }: Params) {
  const requestIp = request.headers.get("x-forwarded-for") ?? "local";
  const limiter = checkRateLimit(`image:${requestIp}`);
  if (!limiter.ok) {
    return jsonError(429, "Rate limit exceeded");
  }

  const url = new URL(request.url);
  const preset = url.searchParams.get("preset");
  const width = Math.min(
    Number(url.searchParams.get("w") ?? (preset === "thumb" ? env.IMAGE_PROXY_THUMB_WIDTH : env.IMAGE_PROXY_MAX_WIDTH)),
    env.IMAGE_PROXY_MAX_WIDTH,
  );
  const height = Math.min(
    Number(url.searchParams.get("h") ?? (preset === "thumb" ? env.IMAGE_PROXY_THUMB_HEIGHT : env.IMAGE_PROXY_MAX_HEIGHT)),
    env.IMAGE_PROXY_MAX_HEIGHT,
  );
  const quality = Number(url.searchParams.get("q") ?? env.IMAGE_PROXY_QUALITY_DEFAULT);
  const fit = url.searchParams.get("fit") === "contain" ? "contain" : "cover";
  const removeBackground =
    env.IMAGE_PROXY_REMOVE_BG && url.searchParams.get("bg") === "remove";
  let format = chooseFormat(request, url.searchParams.get("format"));
  if (removeBackground && (format === "jpeg" || format === "jpg")) {
    format = "webp";
  }
  const pipelineFormat = toPipelineFormat(format);

  const { path } = await params;
  const pathname = path.join("/");
  if (!pathname.startsWith("wp-content/uploads/")) {
    return jsonError(400, "Invalid image path");
  }

  const cacheKey = `${pathname}|${width}|${height}|${quality}|${pipelineFormat}|${fit}|bg:${removeBackground ? "remove" : "keep"}|v:${IMAGE_PIPELINE_VERSION}`;
  const now = Date.now();
  const cached = imageCache.get(cacheKey);
  const ifNoneMatch = request.headers.get("if-none-match");
  if (cached && cached.expiresAt > now) {
    if (ifNoneMatch && ifNoneMatch === cached.etag) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: cached.etag,
          "Cache-Control": `public, max-age=${env.IMAGE_PROXY_CACHE_TTL}, stale-while-revalidate=${env.IMAGE_PROXY_CACHE_TTL}`,
          Vary: "Accept",
          "X-Gashi-Image-Pipeline": IMAGE_PIPELINE_VERSION,
        },
      });
    }
    return new Response(bytesToArrayBuffer(cached.body), {
      headers: {
        "Content-Type": cached.contentType,
        ETag: cached.etag,
        "Cache-Control": `public, max-age=${env.IMAGE_PROXY_CACHE_TTL}, stale-while-revalidate=${env.IMAGE_PROXY_CACHE_TTL}`,
        Vary: "Accept",
        "X-Gashi-Image-Pipeline": IMAGE_PIPELINE_VERSION,
      },
    });
  }

  const upstreamUrl = new URL(path.join("/"), env.WP_BASE_URL);

  const upstream = await fetch(upstreamUrl, {
    cache: "force-cache",
    next: { revalidate: env.IMAGE_PROXY_CACHE_TTL },
    signal: AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS),
  });
  if (!upstream.ok) {
    return jsonError(404, "Image not found");
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  const upstreamContentType = upstream.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream";

  const { buffer: transformed, contentType } = await processCatalogImageBuffer(buffer, {
    width,
    height,
    quality,
    fit,
    format: pipelineFormat,
    removeBackground,
    upstreamContentType,
    logContext: pathname,
  });

  const body = Uint8Array.from(transformed);
  const etag = `"${Buffer.from(cacheKey).toString("base64url")}-${body.byteLength}"`;
  imageCache.set(cacheKey, {
    body,
    contentType,
    etag,
    expiresAt: now + env.IMAGE_PROXY_CACHE_TTL * 1000,
  });

  return new Response(bytesToArrayBuffer(body), {
    headers: {
      "Content-Type": contentType,
      ETag: etag,
      "Cache-Control": `public, max-age=${env.IMAGE_PROXY_CACHE_TTL}, stale-while-revalidate=${env.IMAGE_PROXY_CACHE_TTL}`,
      Vary: "Accept",
      "X-Gashi-Image-Pipeline": IMAGE_PIPELINE_VERSION,
    },
  });
}
