import { z } from "zod";

/** Address as returned by Store API cart/checkout (fields may be empty). */
export const storeApiAddressSchema = z
  .object({
    first_name: z.string().optional().default(""),
    last_name: z.string().optional().default(""),
    company: z.string().optional().default(""),
    address_1: z.string().optional().default(""),
    address_2: z.string().optional().default(""),
    city: z.string().optional().default(""),
    state: z.string().optional().default(""),
    postcode: z.string().optional().default(""),
    country: z.string().optional().default(""),
    email: z.string().optional().default(""),
    phone: z.string().optional().default(""),
  })
  .passthrough();

export type StoreApiAddress = z.infer<typeof storeApiAddressSchema>;

export const cartItemSchema = z.object({
  key: z.string(),
  id: z.coerce.number(),
  quantity: z.coerce.number(),
  name: z.string(),
  images: z
    .array(
      z
        .object({
          src: z.string(),
          thumbnail: z.string().optional(),
        })
        .passthrough(),
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

export const shippingRateOptionSchema = z
  .object({
    rate_id: z.string(),
    name: z.string(),
    selected: z.boolean().optional(),
    price: z.string().optional(),
  })
  .passthrough();

export type ShippingRateOption = z.infer<typeof shippingRateOptionSchema>;

export const shippingPackageSchema = z
  .object({
    package_id: z.coerce.number(),
    name: z.string().optional(),
    shipping_rates: z.array(shippingRateOptionSchema).default([]),
  })
  .passthrough();

export type ShippingPackage = z.infer<typeof shippingPackageSchema>;

export const cartResponseSchema = z
  .object({
    items: z.array(cartItemSchema).default([]),
    fees: z.array(cartFeeSchema).default([]),
    items_count: z.coerce.number().optional(),
    totals: cartTotalsSchema,
    payment_methods: z.array(z.string()).default([]),
    needs_payment: z.boolean().optional(),
    needs_shipping: z.boolean().optional(),
    payment_requirements: z.array(z.string()).default([]),
    shipping_rates: z.array(shippingPackageSchema).default([]),
    billing_address: storeApiAddressSchema.optional(),
    shipping_address: storeApiAddressSchema.optional(),
  })
  .passthrough();

export const addItemSchema = z.object({
  id: z.number().int().positive(),
  quantity: z.number().int().positive().default(1),
});

export const updateItemSchema = z.object({
  key: z.string(),
  quantity: z.number().int().nonnegative(),
});

const checkoutAddressSchema = z.object({
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
  phone: z.string().min(1),
});

const checkoutShippingAddressSchema = z.object({
  first_name: z.string().min(1),
  last_name: z.string().min(1),
  company: z.string().optional().default(""),
  address_1: z.string().min(1),
  address_2: z.string().optional().default(""),
  city: z.string().min(1),
  state: z.string().optional().default(""),
  postcode: z.string().min(1),
  country: z.string().min(2),
});

/** Body for `POST /wc/store/v1/checkout` (place order). */
export const checkoutSchema = z.object({
  billing_address: checkoutAddressSchema,
  shipping_address: checkoutShippingAddressSchema,
  customer_note: z.string().optional(),
  /** Empty when Woo reports `needs_payment: false` (e.g. zero total). */
  payment_method: z.string(),
  payment_data: z.array(z.object({ key: z.string(), value: z.unknown() })).optional(),
  extensions: z.record(z.string(), z.unknown()).optional(),
});

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

/**
 * Partial update for `PUT /wc/store/v1/checkout`.
 * Woo accepts `order_notes`, `payment_method`, `additional_fields`, and may accept addresses depending on version.
 */
export const putCheckoutSchema = z
  .object({
    billing_address: storeApiAddressSchema.optional(),
    shipping_address: storeApiAddressSchema.optional(),
    payment_method: z.string().optional(),
    order_notes: z.string().optional(),
    customer_note: z.string().optional(),
    additional_fields: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type PutCheckoutPayload = z.infer<typeof putCheckoutSchema>;

export const paymentResultSchema = z
  .object({
    payment_status: z.string().optional(),
    payment_details: z.array(z.unknown()).optional(),
    redirect_url: z.string().optional(),
  })
  .passthrough();

/** `GET` / `PUT` checkout draft shape (subset). */
export const checkoutDraftSchema = z
  .object({
    order_id: z.coerce.number().optional(),
    status: z.string().optional(),
    order_key: z.string().optional(),
    order_number: z.string().optional(),
    customer_note: z.string().optional(),
    customer_id: z.coerce.number().optional(),
    billing_address: storeApiAddressSchema.optional(),
    shipping_address: storeApiAddressSchema.optional(),
    payment_method: z.string().optional(),
    payment_result: paymentResultSchema.optional(),
    extensions: z.record(z.string(), z.unknown()).optional(),
  })
  .passthrough();

export type CheckoutDraft = z.infer<typeof checkoutDraftSchema>;

/** Response from `POST /wc/store/v1/checkout` after placing order. */
export const checkoutOrderResultSchema = checkoutDraftSchema;

export type CheckoutOrderResult = z.infer<typeof checkoutOrderResultSchema>;

export type CartResponse = z.infer<typeof cartResponseSchema>;
