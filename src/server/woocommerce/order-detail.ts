import { isHTTPError } from "ky";
import { z } from "zod";
import { productHrefFromOrderLineItem, productPath } from "@/lib/product-url";
import { fetchProductById } from "@/server/product-catalog";
import { resolveWooCustomerIdForAccount } from "@/server/woocommerce/orders";
import { createWooRestClient, hasWooRestCredentials } from "@/server/woocommerce/woo-rest-client";

const wooOrderLineImageSchema = z.preprocess(
  (v) => (v === false || v === null || v === "" ? undefined : v),
  z.object({ src: z.string().optional(), id: z.coerce.number().optional() }).optional(),
);

const wooOrderLineItemSchema = z.object({
  id: z.coerce.number().optional(),
  product_id: z.coerce.number().optional(),
  variation_id: z.coerce.number().optional().nullable(),
  name: z.string(),
  quantity: z.coerce.number(),
  subtotal: z.string().optional(),
  total: z.string(),
  sku: z.string().optional(),
  permalink: z.string().optional().nullable(),
  image: wooOrderLineImageSchema,
});

export type StorefrontOrderLineItemBase = z.infer<typeof wooOrderLineItemSchema>;

export type StorefrontOrderLineItem = StorefrontOrderLineItemBase & {
  storefrontProductPath: `/p/${string}` | null;
  displayImageSrc: string | null;
};

const wooOrderAddressDetailSchema = z.object({
  first_name: z.string().optional().default(""),
  last_name: z.string().optional().default(""),
  company: z.string().optional().default(""),
  address_1: z.string().optional().default(""),
  address_2: z.string().optional().default(""),
  city: z.string().optional().default(""),
  state: z.string().optional().default(""),
  postcode: z.string().optional().default(""),
  country: z.string().optional().default(""),
  email: z.string().optional(),
  phone: z.string().optional(),
});

/** Subset of `GET wc/v3/orders/:id` for storefront order detail UI. */
const wooOrderDetailApiSchema = z.object({
  id: z.number(),
  number: z.string(),
  status: z.string(),
  currency: z.string(),
  date_created: z.string(),
  order_key: z.string(),
  customer_id: z.coerce.number().optional(),
  billing: wooOrderAddressDetailSchema.optional(),
  shipping: wooOrderAddressDetailSchema.optional(),
  line_items: z.array(wooOrderLineItemSchema).default([]),
  total: z.string(),
  shipping_total: z.string().optional(),
  discount_total: z.string().optional(),
  payment_method_title: z.string().optional(),
  customer_note: z.string().optional(),
});

type ParsedOrderDetail = z.infer<typeof wooOrderDetailApiSchema>;

export type StorefrontOrderDetail = Omit<ParsedOrderDetail, "line_items"> & {
  line_items: StorefrontOrderLineItem[];
};

export type FetchOrderDetailResult =
  | { ok: true; order: StorefrontOrderDetail }
  | {
      ok: false;
      code: "no_credentials" | "not_found" | "forbidden" | "parse_error" | "http_error";
    };

export type OrderDetailViewer = {
  orderKeyQuery?: string | null;
  wpUserId?: number;
  email?: string | null;
};

function orderVisibleToViewer(
  order: ParsedOrderDetail,
  viewer: OrderDetailViewer,
  customerId: number | null,
): boolean {
  const keyQ = viewer.orderKeyQuery?.trim();
  if (keyQ && keyQ === order.order_key) {
    return true;
  }
  if (customerId == null) {
    return false;
  }
  const oid = order.customer_id ?? 0;
  if (oid === customerId) {
    return true;
  }
  const emailNorm = viewer.email?.trim().toLowerCase();
  if (oid === 0 && emailNorm && order.billing?.email?.trim().toLowerCase() === emailNorm) {
    return true;
  }
  return false;
}

function lineImageSrcFromWoo(line: StorefrontOrderLineItemBase): string | null {
  const s = line.image?.src?.trim();
  return s || null;
}

async function enrichOrderLineItems(lines: StorefrontOrderLineItemBase[]): Promise<StorefrontOrderLineItem[]> {
  return Promise.all(
    lines.map(async (line) => {
      let storefrontProductPath = productHrefFromOrderLineItem(line);
      let displayImageSrc = lineImageSrcFromWoo(line);

      if (!storefrontProductPath) {
        const vid = line.variation_id ?? 0;
        const pid = line.product_id ?? 0;
        const id = typeof vid === "number" && vid > 0 ? vid : pid;
        if (id > 0) {
          const product = await fetchProductById(id);
          if (product) {
            storefrontProductPath = productPath(product);
            if (!displayImageSrc) {
              const src = product.images[0]?.thumbnail ?? product.images[0]?.src;
              displayImageSrc = src?.trim() || null;
            }
          }
        }
      }

      return { ...line, storefrontProductPath, displayImageSrc };
    }),
  );
}

/**
 * Load a single order for the storefront when the viewer proves possession (`key` query)
 * or is the owning Woo customer / billing e-mail match for guest orders.
 */
export async function fetchOrderDetailIfAllowed(
  orderId: number,
  viewer: OrderDetailViewer,
): Promise<FetchOrderDetailResult> {
  if (!hasWooRestCredentials()) {
    return { ok: false, code: "no_credentials" };
  }

  const woo = createWooRestClient();
  let raw: unknown;
  try {
    raw = await woo.get(`wc/v3/orders/${orderId}`).json();
  } catch (e) {
    if (isHTTPError(e) && e.response.status === 404) {
      return { ok: false, code: "not_found" };
    }
    return { ok: false, code: "http_error" };
  }

  const parsed = wooOrderDetailApiSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, code: "parse_error" };
  }

  const order = parsed.data;
  const customerId = await resolveWooCustomerIdForAccount({
    wpUserId: viewer.wpUserId,
    email: viewer.email,
  });

  if (!orderVisibleToViewer(order, viewer, customerId)) {
    return { ok: false, code: "forbidden" };
  }

  const line_items = await enrichOrderLineItems(order.line_items);
  return { ok: true, order: { ...order, line_items } };
}
