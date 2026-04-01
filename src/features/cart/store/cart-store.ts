"use client";

import {
  addToCart as addToCartRequest,
  getCart,
  type CheckoutPayload,
  postCheckout,
  removeCartItem as removeCartItemRequest,
  selectShippingRate as selectShippingRateRequest,
  setCartItemQuantity as setCartItemQuantityRequest,
} from "@/features/catalog/api";
import type { CartResponse, CheckoutOrderResult } from "@/server/schemas/cart";
import { create } from "zustand";

type CartStatus = "idle" | "loading" | "ready" | "error";

export type CartStoreState = {
  drawerOpen: boolean;
  cart: CartResponse | null;
  status: CartStatus;
  error: string | null;
  mutatingProductId: number | null;
  checkoutError: string | null;
};

type CartStoreActions = {
  setDrawerOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  fetchCart: () => Promise<void>;
  ensureCartLoaded: () => Promise<void>;
  addItem: (productId: number) => Promise<void>;
  updateItemQuantity: (key: string, quantity: number, productId?: number) => Promise<void>;
  removeItem: (key: string, productId?: number) => Promise<void>;
  selectShippingRate: (packageId: number, rateId: string) => Promise<void>;
  submitCheckout: (payload: CheckoutPayload) => Promise<CheckoutOrderResult>;
};

export type CartStore = CartStoreState & CartStoreActions;

let ensureLoadPromise: Promise<void> | null = null;

export function getCartItemsCount(cart: CartResponse | null): number {
  if (!cart) {
    return 0;
  }
  if (typeof cart.items_count === "number") {
    return cart.items_count;
  }
  return cart.items.reduce((total, item) => total + item.quantity, 0);
}

export const useCartStore = create<CartStore>((set, get) => ({
  drawerOpen: false,
  cart: null,
  status: "idle",
  error: null,
  mutatingProductId: null,
  checkoutError: null,

  setDrawerOpen: (open) => set({ drawerOpen: open }),
  openCart: () => set({ drawerOpen: true }),
  closeCart: () => set({ drawerOpen: false }),

  fetchCart: async () => {
    const hadCart = get().cart !== null;
    if (!hadCart) {
      set({ status: "loading", error: null });
    }
    try {
      const cart = await getCart();
      set({ cart, status: "ready", error: null });
    } catch (e) {
      set({
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  },

  ensureCartLoaded: async () => {
    if (get().cart !== null) {
      return;
    }
    if (!ensureLoadPromise) {
      ensureLoadPromise = get()
        .fetchCart()
        .finally(() => {
          ensureLoadPromise = null;
        });
    }
    await ensureLoadPromise;
  },

  addItem: async (productId) => {
    await get().ensureCartLoaded();
    set({ mutatingProductId: productId, error: null });
    try {
      const cart = await addToCartRequest(productId);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Unknown error" });
      throw e;
    } finally {
      set({ mutatingProductId: null });
    }
  },

  updateItemQuantity: async (key, quantity, productId) => {
    await get().ensureCartLoaded();
    const fromCart = get().cart?.items.find((i) => i.key === key)?.id;
    set({ mutatingProductId: productId ?? fromCart ?? null, error: null });
    try {
      const cart = await setCartItemQuantityRequest(key, quantity);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Unknown error" });
      throw e;
    } finally {
      set({ mutatingProductId: null });
    }
  },

  removeItem: async (key, productId) => {
    await get().ensureCartLoaded();
    const fromCart = get().cart?.items.find((i) => i.key === key)?.id;
    set({ mutatingProductId: productId ?? fromCart ?? null, error: null });
    try {
      const cart = await removeCartItemRequest(key);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Unknown error" });
      throw e;
    } finally {
      set({ mutatingProductId: null });
    }
  },

  selectShippingRate: async (packageId, rateId) => {
    await get().ensureCartLoaded();
    set({ error: null });
    try {
      const cart = await selectShippingRateRequest(packageId, rateId);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Unknown error" });
      throw e;
    }
  },

  submitCheckout: async (payload) => {
    set({ checkoutError: null, error: null });
    try {
      const result = await postCheckout(payload);
      const redirect = result.payment_result?.redirect_url;
      if (typeof window !== "undefined" && redirect) {
        window.location.assign(redirect);
        return result;
      }
      await get().fetchCart();
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      set({ checkoutError: message });
      throw e;
    }
  },
}));
