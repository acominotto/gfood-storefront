"use client";

import { apiClient } from "@/lib/api-client";
import { formatWooHttpError } from "@/lib/woo-http-error";
import {
  cartResponseSchema,
  checkoutDraftSchema,
  checkoutOrderResultSchema,
  checkoutSchema,
  type CheckoutPayload,
  type PutCheckoutPayload,
} from "@/server/schemas/cart";
import { facetsResponseSchema, productListSchema } from "@/server/schemas/catalog";
import {
  catalogSuggestResponseSchema,
  type CatalogSuggestResponse,
} from "@/server/schemas/catalog-suggest";
import { z } from "zod";

const productsResponseSchema = z.object({
  products: productListSchema,
  pagination: z.object({
    page: z.number(),
    perPage: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
});

export type ProductResponse = z.infer<typeof productsResponseSchema>;

export type { CheckoutPayload };
export type { CatalogSuggestItem } from "@/server/schemas/catalog-suggest";

export async function getCatalogSuggest(
  q: string,
  options?: { signal?: AbortSignal },
): Promise<CatalogSuggestResponse> {
  const trimmed = q.trim();
  if (trimmed.length === 0) {
    return { items: [] };
  }
  const params = new URLSearchParams({ q: trimmed });
  const response = await apiClient.get(`catalog/suggest?${params.toString()}`, {
    signal: options?.signal,
  });
  return catalogSuggestResponseSchema.parse(await response.json());
}

async function parseWooJson<T>(responsePromise: Promise<Response>, schema: z.ZodType<T>): Promise<T> {
  try {
    const response = await responsePromise;
    const json: unknown = await response.json();
    return schema.parse(json);
  } catch (e) {
    if (e instanceof z.ZodError) {
      throw new Error(e.message);
    }
    throw new Error(await formatWooHttpError(e));
  }
}

export async function getProducts(query: URLSearchParams) {
  const response = await apiClient.get(`catalog/products?${query.toString()}`);
  return productsResponseSchema.parse(await response.json());
}

export async function getFacets() {
  const response = await apiClient.get("catalog/facets");
  return facetsResponseSchema.parse(await response.json());
}

export async function getCart() {
  return parseWooJson(apiClient.get("woo/cart"), cartResponseSchema);
}

export async function addToCart(productId: number) {
  return parseWooJson(
    apiClient.post("woo/cart/add-item", {
      json: {
        id: productId,
        quantity: 1,
      },
    }),
    cartResponseSchema,
  );
}

export async function setCartItemQuantity(key: string, quantity: number) {
  return parseWooJson(
    apiClient.patch(`woo/cart/update-item?key=${encodeURIComponent(key)}`, {
      json: {
        quantity,
      },
    }),
    cartResponseSchema,
  );
}

export async function removeCartItem(key: string) {
  return parseWooJson(
    apiClient.delete(`woo/cart/remove-item?key=${encodeURIComponent(key)}`),
    cartResponseSchema,
  );
}

/** `GET /wc/store/v1/checkout` — draft order and addresses from WooCommerce. */
export async function getCheckout() {
  return parseWooJson(apiClient.get("woo/checkout"), checkoutDraftSchema);
}

/** `PUT /wc/store/v1/checkout` — persist checkout fields; totals recalculate server-side. */
export async function putCheckout(body: PutCheckoutPayload) {
  return parseWooJson(
    apiClient.put("woo/checkout?__experimental_calc_totals=true", { json: body }),
    checkoutDraftSchema,
  );
}

/** `POST /wc/store/v1/cart/select-shipping-rate` */
export async function selectShippingRate(packageId: number, rateId: string) {
  const query = new URLSearchParams({
    package_id: String(packageId),
    rate_id: rateId,
  });
  return parseWooJson(
    apiClient.post(`woo/cart/select-shipping-rate?${query.toString()}`, {
      json: {},
    }),
    cartResponseSchema,
  );
}

/** `POST /wc/store/v1/cart/coupons?code=` — then refresh cart for totals. */
export async function applyCartCoupon(code: string) {
  const trimmed = code.trim();
  try {
    await apiClient.post(`woo/cart/coupons?code=${encodeURIComponent(trimmed)}`, { json: {} });
  } catch (e) {
    throw new Error(await formatWooHttpError(e));
  }
  return parseWooJson(apiClient.get("woo/cart"), cartResponseSchema);
}

/** `DELETE /wc/store/v1/cart/coupons/{code}` — then refresh cart. */
export async function removeCartCoupon(code: string) {
  const trimmed = code.trim();
  try {
    await apiClient.delete(`woo/cart/coupons/${encodeURIComponent(trimmed)}`);
  } catch (e) {
    throw new Error(await formatWooHttpError(e));
  }
  return parseWooJson(apiClient.get("woo/cart"), cartResponseSchema);
}

export async function postCheckout(body: CheckoutPayload) {
  checkoutSchema.parse(body);
  return parseWooJson(apiClient.post("woo/checkout", { json: body }), checkoutOrderResultSchema);
}
