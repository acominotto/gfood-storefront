import { env } from "@/lib/env";
import { checkRateLimit } from "@/server/rate-limit";
import { jsonError } from "@/server/api-response";

type Params = { params: Promise<{ path: string[] }> };

type CachedImage = {
  body: Uint8Array;
  contentType: string;
  etag: string;
  expiresAt: number;
};

const imageCache = new Map<string, CachedImage>();
const IMAGE_PIPELINE_VERSION = "8";

type SharpFactory = typeof import("sharp");

let sharpSingleton: SharpFactory | undefined;

async function getSharp(): Promise<SharpFactory> {
  if (!sharpSingleton) {
    const mod = await import("sharp");
    sharpSingleton = mod.default;
  }
  return sharpSingleton;
}

/**
 * Non-literal `import()` so Turbopack/NFT does not trace `@imgly/background-removal-node` when
 * `IMAGE_PROXY_REMOVE_BG` is off at build time. When the feature is on, `next.config` adds imgly
 * + onnx paths via `outputFileTracingIncludes`.
 */
async function importBackgroundRemovalNode(): Promise<typeof import("@imgly/background-removal-node")> {
  const pkg = ["@imgly/background-removal-", "node"].join("");
  return import(pkg);
}

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

async function removeDarkBorderBackground(buffer: Buffer) {
  const sharp = await getSharp();
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const pixelCount = width * height;
  if (!pixelCount) {
    return buffer;
  }

  const visited = new Uint8Array(pixelCount);
  const queue = new Uint32Array(pixelCount);
  let head = 0;
  let tail = 0;

  const isDarkPixel = (index: number) => {
    const offset = index * 4;
    const alpha = data[offset + 3];
    if (alpha < 8) {
      return false;
    }
    const r = data[offset];
    const g = data[offset + 1];
    const b = data[offset + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const chroma = max - min;
    const luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
    return luma < 40 && chroma < 28;
  };

  const tryQueue = (index: number) => {
    if (index < 0 || index >= pixelCount || visited[index]) {
      return;
    }
    if (!isDarkPixel(index)) {
      return;
    }
    visited[index] = 1;
    queue[tail] = index;
    tail += 1;
  };

  for (let x = 0; x < width; x += 1) {
    tryQueue(x);
    tryQueue((height - 1) * width + x);
  }
  for (let y = 0; y < height; y += 1) {
    tryQueue(y * width);
    tryQueue(y * width + (width - 1));
  }

  while (head < tail) {
    const current = queue[head];
    head += 1;
    const x = current % width;
    const y = Math.floor(current / width);
    for (let dy = -1; dy <= 1; dy += 1) {
      for (let dx = -1; dx <= 1; dx += 1) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= width || ny >= height) {
          continue;
        }
        tryQueue(ny * width + nx);
      }
    }
  }

  let removed = 0;
  for (let index = 0; index < pixelCount; index += 1) {
    if (!visited[index]) {
      continue;
    }
    const alphaOffset = index * 4 + 3;
    if (data[alphaOffset] !== 0) {
      data[alphaOffset] = 0;
      removed += 1;
    }
  }

  if (removed === 0) {
    return buffer;
  }

  return sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

async function clampLowAlphaToTransparent(buffer: Buffer, threshold = 32) {
  const sharp = await getSharp();
  const { data, info } = await sharp(buffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height } = info;
  const pixelCount = width * height;
  if (!pixelCount) {
    return buffer;
  }

  let adjusted = 0;
  for (let index = 0; index < pixelCount; index += 1) {
    const alphaOffset = index * 4 + 3;
    if (data[alphaOffset] > 0 && data[alphaOffset] < threshold) {
      data[alphaOffset] = 0;
      adjusted += 1;
    }
  }

  if (adjusted === 0) {
    return buffer;
  }

  return sharp(data, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
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
  const removeBg =
    env.IMAGE_PROXY_REMOVE_BG && url.searchParams.get("bg") === "remove";
  let format = chooseFormat(request, url.searchParams.get("format"));
  if (removeBg && (format === "jpeg" || format === "jpg")) {
    format = "webp";
  }

  const { path } = await params;
  const pathname = path.join("/");
  if (!pathname.startsWith("wp-content/uploads/")) {
    return jsonError(400, "Invalid image path");
  }

  const cacheKey = `${pathname}|${width}|${height}|${quality}|${format}|${fit}|bg:${removeBg ? "remove" : "keep"}|v:${IMAGE_PIPELINE_VERSION}`;
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
  let sourceBuffer: Buffer<ArrayBufferLike> = buffer;
  if (removeBg) {
    const upstreamContentType = upstream.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream";
    try {
      // Load only when needed: @imgly/background-removal-node pulls in onnxruntime-node (native
      // .node/.dll/.so). A static import would initialize that for every image request and can
      // break the whole route on serverless (e.g. Vercel) when the runtime binary fails to load.
      const { removeBackground } = await importBackgroundRemovalNode();
      // The background-removal library relies on Blob MIME type detection.
      // Passing a raw Buffer causes format detection to fail and returns the original image.
      const result = await removeBackground(new Blob([buffer], { type: upstreamContentType }), {
        model: "small",
        output: {
          format: "image/png",
          quality: 0.9,
        },
      });
      sourceBuffer = Buffer.from(await result.arrayBuffer());
      sourceBuffer = await clampLowAlphaToTransparent(sourceBuffer);
      sourceBuffer = await removeDarkBorderBackground(sourceBuffer);
    } catch (err) {
      // Native onnxruntime-node can fail on Linux serverless while working locally; unlogged, that looked like “wrong images” on Vercel.
      console.error("[image-proxy] background removal failed", {
        pathname,
        error: err instanceof Error ? err.message : String(err),
      });
      sourceBuffer = buffer;
    }
  }
  const sharp = await getSharp();
  let transformed: Buffer;
  let contentType = "image/webp";

  if (format === "avif") {
    transformed = await sharp(sourceBuffer)
      .resize({ width, height, fit, position: "centre", withoutEnlargement: true })
      .avif({ quality })
      .toBuffer();
    contentType = "image/avif";
  } else if (format === "jpeg" || format === "jpg") {
    transformed = await sharp(sourceBuffer)
      .resize({ width, height, fit, position: "centre", withoutEnlargement: true })
      .jpeg({ quality })
      .toBuffer();
    contentType = "image/jpeg";
  } else {
    transformed = await sharp(sourceBuffer)
      .resize({ width, height, fit, position: "centre", withoutEnlargement: true })
      .webp({ quality })
      .toBuffer();
  }

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
