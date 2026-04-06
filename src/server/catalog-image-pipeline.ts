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

export type CatalogImageOutputFormat = "webp" | "jpeg" | "jpg" | "avif";

export type ProcessCatalogImageBufferOptions = {
  width: number;
  height: number;
  quality: number;
  fit: "contain" | "cover";
  format: CatalogImageOutputFormat;
  /** When true, run ML background removal (caller should also gate on env if needed). */
  removeBackground: boolean;
  upstreamContentType?: string;
  /** Logged when background removal throws (e.g. image pathname). */
  logContext?: string;
};

export type ProcessCatalogImageBufferResult = {
  buffer: Buffer;
  contentType: string;
};

async function applyBackgroundRemoval(
  buffer: Buffer,
  upstreamContentType: string,
  logContext: string | undefined,
): Promise<Buffer> {
  try {
    const { removeBackground } = await importBackgroundRemovalNode();
    const result = await removeBackground(new Blob([new Uint8Array(buffer)], { type: upstreamContentType }), {
      model: "small",
      output: {
        format: "image/png",
        quality: 0.9,
      },
    });
    let out: Buffer = Buffer.from(await result.arrayBuffer());
    out = Buffer.from(await clampLowAlphaToTransparent(out));
    out = Buffer.from(await removeDarkBorderBackground(out));
    return out;
  } catch (err) {
    console.error("[image-proxy] background removal failed", {
      pathname: logContext,
      error: err instanceof Error ? err.message : String(err),
    });
    return buffer;
  }
}

/**
 * Resize and encode an image buffer the same way as `GET /api/images/*`.
 */
export async function processCatalogImageBuffer(
  buffer: Buffer,
  options: ProcessCatalogImageBufferOptions,
): Promise<ProcessCatalogImageBufferResult> {
  const {
    width,
    height,
    quality,
    fit,
    format: formatIn,
    removeBackground,
    upstreamContentType = "application/octet-stream",
    logContext,
  } = options;

  let format: CatalogImageOutputFormat = formatIn;
  if (removeBackground && (format === "jpeg" || format === "jpg")) {
    format = "webp";
  }

  let sourceBuffer: Buffer = buffer;
  if (removeBackground) {
    sourceBuffer = await applyBackgroundRemoval(buffer, upstreamContentType, logContext);
  }

  const sharp = await getSharp();
  // Sharp defaults `fit: "contain"` letterboxing to opaque black. Use transparent padding for
  // formats that support alpha so cutouts (e.g. after background removal) do not get black bars.
  const resizeOpts = {
    width,
    height,
    fit,
    position: "centre" as const,
    withoutEnlargement: true,
    ...(format === "webp" || format === "avif"
      ? { background: { r: 0, g: 0, b: 0, alpha: 0 } }
      : {}),
  };

  if (format === "avif") {
    const out = await sharp(sourceBuffer).resize(resizeOpts).avif({ quality }).toBuffer();
    return { buffer: out, contentType: "image/avif" };
  }
  if (format === "jpeg" || format === "jpg") {
    const out = await sharp(sourceBuffer).resize(resizeOpts).jpeg({ quality }).toBuffer();
    return { buffer: out, contentType: "image/jpeg" };
  }
  const out = await sharp(sourceBuffer).resize(resizeOpts).webp({ quality }).toBuffer();
  return { buffer: out, contentType: "image/webp" };
}
