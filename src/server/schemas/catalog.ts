import { z } from "zod";
import { akwaraIdFromWooProduct } from "@/lib/akwara-id";
import { decodeHtmlEntities } from "@/lib/html-plain";

const wooText = z.string().transform((s) => decodeHtmlEntities(s));
const wooTextOptional = z
  .string()
  .optional()
  .transform((s) => (s !== undefined ? decodeHtmlEntities(s) : s));

export const productsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  /** `pa_origine` term slugs (multi-select, OR within attribute). */
  origine: z.array(z.string().min(1)).max(48).optional(),
  /** `pa_regime` term slugs (multi-select, OR within attribute). */
  regime: z.array(z.string().min(1)).max(48).optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  inStock: z.coerce.boolean().optional(),
  page: z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().min(1).max(48).default(12),
  orderBy: z.enum(["date", "price", "popularity", "rating", "title"]).default("title"),
  order: z.enum(["asc", "desc"]).default("asc"),
});

export const imageSchema = z.object({
  id: z.number(),
  src: z.string().url(),
  thumbnail: z.string().url().optional(),
  srcset: z.string().optional(),
  sizes: z.string().optional(),
  name: wooTextOptional,
  alt: wooTextOptional,
});

export const productSchema = z
  .object({
    id: z.number(),
    name: wooText,
    slug: z.string(),
    permalink: z.string().optional(),
    short_description: wooTextOptional,
    prices: z
      .object({
        currency_code: z.string(),
        currency_symbol: z.string().optional(),
        price: z.string(),
        regular_price: z.string().optional(),
        sale_price: z.string().optional(),
      })
      .optional(),
    average_rating: z.string().optional(),
    review_count: z.number().optional(),
    is_in_stock: z.boolean().optional(),
    is_purchasable: z.boolean().optional().default(true),
    images: z.array(imageSchema).default([]),
    categories: z
      .array(z.object({ id: z.number(), name: wooText, slug: z.string() }))
      .default([]),
    extensions: z.record(z.string(), z.unknown()).nullish(),
    sku: z.string().nullish(),
    attributes: z.array(z.record(z.string(), z.unknown())).nullish(),
  })
  .transform((p) => {
    const { extensions, attributes, ...rest } = p;
    return {
      ...rest,
      sku: p.sku ?? undefined,
      attributes: attributes ?? undefined,
      akwaraId:
        akwaraIdFromWooProduct({
          extensions: extensions ?? undefined,
          sku: p.sku ?? undefined,
          attributes: attributes ?? undefined,
        }) ?? null,
    };
  });

export const productListSchema = z.array(productSchema);

export const categorySchema = z.object({
  id: z.number(),
  name: wooText,
  slug: z.string(),
  count: z.number().optional(),
  /** WooCommerce parent term id; 0 = top-level */
  parent: z.preprocess((v: unknown) => {
    if (v === null || v === undefined) return 0;
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }, z.number()),
});

export const categoryListSchema = z.array(categorySchema);

const regimeFacetTermSchema = z.object({
  slug: z.string(),
  name: wooText,
});

export const facetsResponseSchema = z.object({
  categories: categoryListSchema,
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
  /** Terms for global attribute `pa_origine`. */
  origineTerms: z.array(regimeFacetTermSchema).default([]),
  /** Terms for global attribute `pa_regime` (diet). */
  regimeTerms: z.array(regimeFacetTermSchema).default([]),
});

export type ProductsQuery = z.infer<typeof productsQuerySchema>;
export type Product = z.infer<typeof productSchema>;
export type Category = z.infer<typeof categorySchema>;
