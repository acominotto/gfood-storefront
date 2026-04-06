/**
 * Downloads all WooCommerce Store API product images, runs the same pipeline as GET /api/images
 * (background removal when IMAGE_PROXY_REMOVE_BG=true, WebP, max 1000×1000 contain), and writes
 * to ./woocommerce-sanitized-images/{akwaraId}.webp when akwaraId is set (first image per id), or
 * {akwaraId}-{attachmentId}.webp for further images with the same akwaraId; otherwise {attachmentId}.webp
 *
 * Run from repo root: pnpm woo:fetch-sanitized-images
 *
 * Akwara file names need a product id. The Store API usually does not send it — set
 * WOO_CONSUMER_KEY + WOO_CONSUMER_SECRET (same as Woo REST API) so this script can read
 * meta_data from WC v3. Override keys with AKWARA_META_KEYS=comma,separated,meta_keys
 * (defaults: _akwara_id,akwara_id,akwaraId,akwara).
 *
 * Background removal uses @imgly/background-removal-node (same as /api/images). This script turns
 * it on by default so exports match “sanitized” expectations; use --no-remove-bg to skip ML (faster).
 *
 * Options (pass after `--` with pnpm):
 *   --dry-run          No image fetch/pipeline/files; still writes products-manifest.json (akwara + images per product).
 *   --limit <n>        Process at most n images that would be written (skips for existing files
 *                      or bad paths do not count). Example: pnpm woo:fetch-sanitized-images -- --limit 10
 *   --no-remove-bg     Skip ML background removal (Sharp WebP resize only).
 */

import { config as loadDotenv } from "dotenv";
import { mkdir, stat, writeFile } from "node:fs/promises";
import type { Product } from "@/server/schemas/catalog";
import path from "node:path";
import ky from "ky";
import { z } from "zod";
import { processCatalogImageBuffer } from "@/server/catalog-image-pipeline";
import { productListSchema } from "@/server/schemas/catalog";
import {
  fetchProductMetaById,
  parseAkwaraMetaKeysFromEnv,
} from "@/server/woo-akwara-meta";

const OUTPUT_DIR = "woocommerce-sanitized-images";
const PER_PAGE = 100;
const MAX_DIMENSION = 1000;

const scriptEnvSchema = z.object({
  WP_BASE_URL: z.string().url(),
  WOO_STORE_API_BASE: z.string().default("/wp-json/wc/store/v1"),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  IMAGE_PROXY_QUALITY_DEFAULT: z.coerce.number().int().min(20).max(95).optional(),
  WOO_CONSUMER_KEY: z.string().optional(),
  WOO_CONSUMER_SECRET: z.string().optional(),
  AKWARA_META_KEYS: z.string().optional(),
});

function loadEnvFiles() {
  const root = process.cwd();
  loadDotenv({ path: path.join(root, ".env.local") });
  loadDotenv({ path: path.join(root, ".env") });
}

function parseScriptEnv() {
  const raw = scriptEnvSchema.safeParse({
    WP_BASE_URL: process.env.WP_BASE_URL,
    WOO_STORE_API_BASE: process.env.WOO_STORE_API_BASE,
    UPSTREAM_TIMEOUT_MS: process.env.UPSTREAM_TIMEOUT_MS,
    IMAGE_PROXY_QUALITY_DEFAULT: process.env.IMAGE_PROXY_QUALITY_DEFAULT,
    WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY,
    WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET,
    AKWARA_META_KEYS: process.env.AKWARA_META_KEYS,
  });
  if (!raw.success) {
    throw new Error(`Invalid script environment: ${raw.error.message}`);
  }
  const quality = raw.data.IMAGE_PROXY_QUALITY_DEFAULT ?? 82;
  const akwaraMetaKeys = parseAkwaraMetaKeysFromEnv(raw.data.AKWARA_META_KEYS);
  return { ...raw.data, quality, akwaraMetaKeys };
}

async function fileExistsNonEmpty(filePath: string): Promise<boolean> {
  try {
    const s = await stat(filePath);
    return s.size > 0;
  } catch {
    return false;
  }
}

type CliOptions = {
  dryRun: boolean;
  limit: number | undefined;
  noRemoveBg: boolean;
};

function parseCliArgs(argv: string[]): CliOptions {
  let dryRun = false;
  let limit: number | undefined;
  let noRemoveBg = false;
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    if (a === "--dry-run") {
      dryRun = true;
    } else if (a === "--no-remove-bg") {
      noRemoveBg = true;
    } else if (a === "--limit") {
      const next = argv[i + 1];
      if (next === undefined) {
        throw new Error("--limit requires a number");
      }
      limit = Number(next);
      i += 1;
    } else if (a.startsWith("--limit=")) {
      limit = Number(a.slice("--limit=".length));
    }
  }
  if (limit !== undefined) {
    if (!Number.isInteger(limit) || limit < 1) {
      throw new Error("--limit must be a positive integer");
    }
  }
  return { dryRun, limit, noRemoveBg };
}

type ManifestProductRow = {
  wooProductId: number;
  slug: string;
  name: string;
  akwaraId: string | null;
  imageAttachmentIds: number[];
};

type ManifestImageEntry = {
  attachmentId: number;
  /** Basename under woocommerce-sanitized-images/ (e.g. AK-12.webp or 97828.webp). */
  exportFile: string;
};

function sanitizeAkwaraFileStem(raw: string): string {
  const s = raw
    .trim()
    .replace(/[/\\?%*:|"<>]/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^\.+|\.+$/g, "");
  return s.length > 0 ? s : "akwara";
}

/**
 * Prefer `{stem}.webp` for the first attachment seen per akwara stem; further attachments use `{stem}-{id}.webp`.
 */
function webpOutputBasename(
  akwaraId: string | null | undefined,
  attachmentId: number,
  firstAttachmentByAkwaraStem: Map<string, number>,
): string {
  const trimmed = akwaraId?.trim();
  if (!trimmed) {
    return `${attachmentId}.webp`;
  }
  const stem = sanitizeAkwaraFileStem(trimmed);
  const mapKey = stem.toLowerCase();
  const existing = firstAttachmentByAkwaraStem.get(mapKey);
  if (existing === undefined) {
    firstAttachmentByAkwaraStem.set(mapKey, attachmentId);
    return `${stem}.webp`;
  }
  if (existing === attachmentId) {
    return `${stem}.webp`;
  }
  return `${stem}-${attachmentId}.webp`;
}

function mergeProductIntoManifest(
  map: Map<number, ManifestProductRow>,
  product: Product,
  effectiveAkwaraId: string | null,
) {
  let row = map.get(product.id);
  if (!row) {
    row = {
      wooProductId: product.id,
      slug: product.slug,
      name: product.name,
      akwaraId: effectiveAkwaraId,
      imageAttachmentIds: [],
    };
    map.set(product.id, row);
  } else {
    row.akwaraId = row.akwaraId ?? effectiveAkwaraId;
  }
  for (const img of product.images) {
    if (!row.imageAttachmentIds.includes(img.id)) {
      row.imageAttachmentIds.push(img.id);
    }
  }
}

async function main() {
  const cli = parseCliArgs(process.argv.slice(2));
  loadEnvFiles();
  const env = parseScriptEnv();
  const wooPrefix = new URL(env.WOO_STORE_API_BASE, env.WP_BASE_URL).toString();
  const client = ky.create({
    prefixUrl: wooPrefix,
    timeout: env.UPSTREAM_TIMEOUT_MS,
    hooks: {
      beforeRequest: [
        (request) => {
          request.headers.set("Accept", "application/json");
        },
      ],
    },
    retry: { limit: 1 },
  });

  const removeBackground = !cli.noRemoveBg;
  if (!cli.dryRun) {
    console.log(removeBackground ? "Background removal: on (ML)" : "Background removal: off (--no-remove-bg)");
  }

  let v3AkwaraByProduct = new Map<number, string>();
  const ck = env.WOO_CONSUMER_KEY?.trim();
  const cs = env.WOO_CONSUMER_SECRET?.trim();
  if (ck && cs) {
    console.log(
      `Fetching Akwara ids from WooCommerce REST v3 (meta keys: ${env.akwaraMetaKeys.join(", ")})…`,
    );
    try {
      v3AkwaraByProduct = await fetchProductMetaById(env.WP_BASE_URL, ck, cs, env.akwaraMetaKeys, {
        timeoutMs: env.UPSTREAM_TIMEOUT_MS,
      });
      console.log(`WC v3: found meta on ${v3AkwaraByProduct.size} product(s).`);
    } catch (e) {
      console.error("WC v3 meta fetch failed (images still use Store API only):", e);
    }
  } else {
    console.warn(
      "WOO_CONSUMER_KEY / WOO_CONSUMER_SECRET not set — Store API rarely includes Akwara; files stay {attachmentId}.webp. Set API keys to read meta_data from /wc/v3/products.",
    );
  }

  const outDir = path.join(process.cwd(), OUTPUT_DIR);
  await mkdir(outDir, { recursive: true });

  const manifestByProduct = new Map<number, ManifestProductRow>();
  const attachmentExportFile = new Map<number, string>();
  const firstAttachmentByAkwaraStem = new Map<string, number>();
  const seenImageIds = new Set<number>();
  let page = 1;
  const budget = cli.limit ?? Number.POSITIVE_INFINITY;
  let processedTowardLimit = 0;
  let stoppedEarly = false;

  catalog: for (;;) {
    const params = new URLSearchParams({
      page: String(page),
      per_page: String(PER_PAGE),
      orderby: "title",
      order: "asc",
    });
    const response = await client.get(`products?${params.toString()}`);
    const products = productListSchema.parse(await response.json());
    if (products.length === 0) {
      break;
    }

    for (const product of products) {
      const effectiveAkwaraId: string | null =
        v3AkwaraByProduct.get(product.id) ?? product.akwaraId ?? null;
      mergeProductIntoManifest(manifestByProduct, product, effectiveAkwaraId);

      for (const image of product.images) {
        if (seenImageIds.has(image.id)) {
          continue;
        }
        seenImageIds.add(image.id);

        const basename = webpOutputBasename(effectiveAkwaraId, image.id, firstAttachmentByAkwaraStem);
        attachmentExportFile.set(image.id, basename);
        const dest = path.join(outDir, basename);
        if (await fileExistsNonEmpty(dest)) {
          console.log(cli.dryRun ? `[dry-run] skip (exists) ${basename}` : `skip (exists) ${basename}`);
          continue;
        }

        const pathname = new URL(image.src, env.WP_BASE_URL).pathname.replace(/^\//, "");
        if (!pathname.startsWith("wp-content/uploads/")) {
          console.warn(`skip (path) image ${image.id}: ${pathname}`);
          continue;
        }

        if (processedTowardLimit >= budget) {
          stoppedEarly = true;
          break catalog;
        }

        const imageUrl = new URL(pathname, env.WP_BASE_URL);
        if (cli.dryRun) {
          console.log(`[dry-run] would fetch ${imageUrl.href} → ${dest}`);
          processedTowardLimit += 1;
          continue;
        }

        const upstream = await fetch(imageUrl, {
          signal: AbortSignal.timeout(env.UPSTREAM_TIMEOUT_MS),
        });
        if (!upstream.ok) {
          console.warn(`skip (fetch ${upstream.status}) image ${image.id}: ${imageUrl}`);
          continue;
        }

        const buffer = Buffer.from(await upstream.arrayBuffer());
        const upstreamContentType =
          upstream.headers.get("content-type")?.split(";")[0] ?? "application/octet-stream";

        const { buffer: out, contentType } = await processCatalogImageBuffer(buffer, {
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          quality: env.quality,
          fit: "contain",
          format: "webp",
          removeBackground,
          upstreamContentType,
          logContext: pathname,
        });

        if (contentType !== "image/webp") {
          console.warn(`unexpected content type for image ${image.id}: ${contentType}`);
        }

        await writeFile(dest, out);
        console.log(`wrote ${dest}`);
        processedTowardLimit += 1;
      }
    }

    const totalPages = Number(response.headers.get("x-wp-totalpages") ?? 1);
    if (page >= totalPages) {
      break;
    }
    page += 1;
  }

  const manifestPath = path.join(outDir, "products-manifest.json");
  const manifestPayload = {
    generatedAt: new Date().toISOString(),
    akwaraMetaKeysUsed: env.akwaraMetaKeys,
    wooV3ProductsWithMeta: v3AkwaraByProduct.size,
    products: [...manifestByProduct.values()]
      .sort((a, b) => a.wooProductId - b.wooProductId)
      .map((row) => ({
        wooProductId: row.wooProductId,
        slug: row.slug,
        name: row.name,
        akwaraId: row.akwaraId,
        imageAttachmentIds: row.imageAttachmentIds,
        images: row.imageAttachmentIds.map(
          (attachmentId): ManifestImageEntry => ({
            attachmentId,
            exportFile: attachmentExportFile.get(attachmentId) ?? `${attachmentId}.webp`,
          }),
        ),
      })),
  };
  await writeFile(manifestPath, `${JSON.stringify(manifestPayload, null, 2)}\n`, "utf-8");
  console.log(`Wrote ${manifestPath} (${manifestPayload.products.length} products)`);

  const mode = cli.dryRun ? "dry-run" : "wrote";
  const limitNote =
    cli.limit !== undefined ? `; ${mode} ${processedTowardLimit}/${cli.limit}${stoppedEarly ? " (stopped at limit)" : ""}` : "";
  console.log(
    `Done. ${seenImageIds.size} unique image id(s) seen${cli.dryRun ? "" : `; output: ${outDir}`}${limitNote}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
