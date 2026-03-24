"use client";

import { apiClient } from "@/lib/api-client";
import { cartResponseSchema, checkoutSchema } from "@/server/schemas/cart";
import { facetsResponseSchema, productListSchema } from "@/server/schemas/catalog";
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

export async function getProducts(query: URLSearchParams) {
  const response = await apiClient.get(`catalog/products?${query.toString()}`);
  return productsResponseSchema.parse(await response.json());
}

export async function getFacets() {
  const response = await apiClient.get("catalog/facets");
  return facetsResponseSchema.parse(await response.json());
}

export async function getCart() {
  const response = await apiClient.get("woo/cart");
  return cartResponseSchema.parse(await response.json());
}

export async function addToCart(productId: number) {
  const response = await apiClient.post("woo/cart/add-item", {
    json: {
      id: productId,
      quantity: 1,
    },
  });
  return cartResponseSchema.parse(await response.json());
}

export async function setCartItemQuantity(key: string, quantity: number) {
  const response = await apiClient.patch(`woo/cart/update-item?key=${encodeURIComponent(key)}`, {
    json: {
      quantity,
    },
  });
  return cartResponseSchema.parse(await response.json());
}

export async function removeCartItem(key: string) {
  const response = await apiClient.delete(`woo/cart/remove-item?key=${encodeURIComponent(key)}`);
  return cartResponseSchema.parse(await response.json());
}

export type CheckoutPayload = z.infer<typeof checkoutSchema>;

export async function postCheckout(body: CheckoutPayload) {
  const response = await apiClient.post("woo/checkout", { json: body });
  return response.json() as Promise<unknown>;
}
