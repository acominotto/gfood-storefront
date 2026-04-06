import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { getWooStoreBaseUrl } from "@/lib/woo-store-url";
import { createHttpClient } from "@/server/http";

const CART_TOKEN_COOKIE = "woo_cart_token";
const STORE_NONCE_COOKIE = "woo_store_nonce";

export function getWooBaseUrl() {
  return getWooStoreBaseUrl();
}

export async function getWooSessionHeaders() {
  const cookieStore = await cookies();
  const cartToken = cookieStore.get(CART_TOKEN_COOKIE)?.value;
  const nonce = cookieStore.get(STORE_NONCE_COOKIE)?.value;

  return {
    ...(cartToken ? { "Cart-Token": cartToken } : {}),
    ...(nonce ? { Nonce: nonce } : {}),
  };
}

type PersistWooSessionOptions = {
  /**
   * When false, skip updating `woo_cart_token` from this response.
   * WooCommerce `GET /checkout` can emit a Cart-Token that does not match the
   * active cart session; persisting it makes the next `GET /cart` return empty.
   */
  persistCartToken?: boolean;
};

export async function persistWooSessionHeaders(
  headers: Headers,
  options: PersistWooSessionOptions = {},
) {
  const persistCartToken = options.persistCartToken !== false;
  const cartToken = headers.get("cart-token");
  const nonce = headers.get("nonce");

  const cookieStore = await cookies();
  if (persistCartToken && cartToken) {
    cookieStore.set(CART_TOKEN_COOKIE, cartToken, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
    });
  }
  if (nonce) {
    cookieStore.set(STORE_NONCE_COOKIE, nonce, {
      httpOnly: true,
      secure: env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12,
    });
  }
}

export function createWooClient() {
  return createHttpClient(getWooBaseUrl());
}
