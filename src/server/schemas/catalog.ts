import { z } from "zod";

export const productsQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
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
  name: z.string().optional(),
  alt: z.string().optional(),
});

export const productSchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  permalink: z.string().optional(),
  short_description: z.string().optional(),
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
  categories: z.array(z.object({ id: z.number(), name: z.string(), slug: z.string() })).default([]),
});

export const productListSchema = z.array(productSchema);

export const categorySchema = z.object({
  id: z.number(),
  name: z.string(),
  slug: z.string(),
  count: z.number().optional(),
});

export const categoryListSchema = z.array(categorySchema);

export const facetsResponseSchema = z.object({
  categories: categoryListSchema,
  priceRange: z.object({
    min: z.number().nonnegative(),
    max: z.number().nonnegative(),
  }),
});

export type ProductsQuery = z.infer<typeof productsQuerySchema>;
export type Product = z.infer<typeof productSchema>;
