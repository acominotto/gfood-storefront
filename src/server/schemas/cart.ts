import { z } from "zod";

const nullableString = z.string().nullable().optional();

export const cartItemSchema = z.object({
  key: z.string(),
  id: z.coerce.number(),
  quantity: z.coerce.number(),
  name: z.string(),
  images: z
    .array(
      z.object({
        src: z.string().url(),
        thumbnail: z.string().url().optional(),
      }),
    )
    .default([]),
  prices: z
    .object({
      currency_code: nullableString,
      line_total: nullableString,
      line_subtotal: nullableString,
    })
    .optional(),
});

export const cartTotalsSchema = z
  .object({
    currency_code: nullableString,
    total_items: nullableString,
    total_price: nullableString,
    total_tax: nullableString,
    total_shipping: nullableString,
  })
  .optional();

export const cartResponseSchema = z.object({
  items: z.array(cartItemSchema).default([]),
  items_count: z.coerce.number().optional(),
  totals: cartTotalsSchema,
});

export const addItemSchema = z.object({
  id: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const updateItemSchema = z.object({
  key: z.string(),
  quantity: z.number().int().nonnegative(),
});

export const checkoutSchema = z.object({
  billing_address: z.object({
    first_name: z.string().min(1),
    last_name: z.string().min(1),
    company: z.string().optional().default(""),
    address_1: z.string().min(1),
    address_2: z.string().optional().default(""),
    city: z.string().min(1),
    state: z.string().optional().default(""),
    postcode: z.string().min(1),
    country: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(3),
  }),
  shipping_address: z
    .object({
      first_name: z.string().min(1),
      last_name: z.string().min(1),
      company: z.string().optional().default(""),
      address_1: z.string().min(1),
      address_2: z.string().optional().default(""),
      city: z.string().min(1),
      state: z.string().optional().default(""),
      postcode: z.string().min(1),
      country: z.string().min(2),
    })
    .optional(),
  customer_note: z.string().optional(),
  payment_method: z.string().optional(),
  payment_data: z.array(z.object({ key: z.string(), value: z.string() })).optional(),
});

export type CartResponse = z.infer<typeof cartResponseSchema>;
