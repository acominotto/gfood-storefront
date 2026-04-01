import { z } from "zod";
import { decodeHtmlEntities } from "@/lib/html-plain";

const wooText = z.string().transform((s) => decodeHtmlEntities(s));

export const catalogSuggestQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(1, "q required")
    .max(80, "q too long"),
});

const suggestProductRowSchema = z.object({
  id: z.number(),
  name: wooText,
  slug: z.string(),
});

const suggestCategoryRowSchema = z.object({
  id: z.number(),
  name: wooText,
  slug: z.string(),
});

export const catalogSuggestItemSchema = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("product"),
    id: z.number(),
    slug: z.string(),
    label: z.string(),
  }),
  z.object({
    kind: z.literal("category"),
    id: z.number(),
    slug: z.string(),
    label: z.string(),
  }),
]);

export const catalogSuggestResponseSchema = z.object({
  items: z.array(catalogSuggestItemSchema),
});

export type CatalogSuggestItem = z.infer<typeof catalogSuggestItemSchema>;
export type CatalogSuggestResponse = z.infer<typeof catalogSuggestResponseSchema>;

export { suggestProductRowSchema, suggestCategoryRowSchema };
