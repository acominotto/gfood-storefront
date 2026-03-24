"use client";

import {
  addToCart as addToCartRequest,
  getCart,
  type CheckoutPayload,
  postCheckout,
  removeCartItem as removeCartItemRequest,
  setCartItemQuantity as setCartItemQuantityRequest,
} from "@/features/catalog/api";
import type { CartResponse } from "@/server/schemas/cart";
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
  submitCheckout: (payload: CheckoutPayload) => Promise<unknown>;
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

  submitCheckout: async (payload) => {
    set({ checkoutError: null, error: null });
    try {
      const result = await postCheckout(payload);
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      set({ checkoutError: message });
      throw e;
    }
  },
}));
