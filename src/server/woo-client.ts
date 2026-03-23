import { cookies } from "next/headers";
import { env } from "@/lib/env";
import { createHttpClient } from "@/server/http";

const CART_TOKEN_COOKIE = "woo_cart_token";
const STORE_NONCE_COOKIE = "woo_store_nonce";

export function getWooBaseUrl() {
  return new URL(env.WOO_STORE_API_BASE, env.WP_BASE_URL).toString();
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

export async function persistWooSessionHeaders(headers: Headers) {
  const cartToken = headers.get("cart-token");
  const nonce = headers.get("nonce");

  const cookieStore = await cookies();
  if (cartToken) {
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
