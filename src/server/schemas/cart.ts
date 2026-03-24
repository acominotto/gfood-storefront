import { z } from "zod";



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
      currency_code: z.string().nullish(),
      /** Unit price in minor units (WooCommerce Store API). */
      price: z.string().nullish(),
      line_total: z.string().nullish(),
      line_subtotal: z.string().nullish(),
    })
    .optional(),
});

export const cartTotalsSchema = z
  .object({
    currency_code: z.string().nullish(),
    total_items: z.string().nullish(),
    total_price: z.string().nullish(),
    total_tax: z.string().nullish(),
    total_shipping: z.string().nullish(),
    total_fees: z.string().nullish(),
    total_fees_tax: z.string().nullish(),
  })
  .optional();

/** WooCommerce Store API `fees` (e.g. delivery surcharges from `woocommerce_cart_calculate_fees`). */
export const cartFeeSchema = z.object({
  key: z.string(),
  name: z.string(),
  totals: z
    .object({
      total: z.string().nullish(),
      total_tax: z.string().nullish(),
      currency_code: z.string().nullish(),
    })
    .passthrough()
    .optional(),
});

export const cartResponseSchema = z.object({
  items: z.array(cartItemSchema).default([]),
  fees: z.array(cartFeeSchema).default([]),
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
