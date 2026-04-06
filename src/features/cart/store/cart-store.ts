"use client";

import {
  addToCart as addToCartRequest,
  applyCartCoupon as applyCartCouponRequest,
  getCart,
  type CheckoutPayload,
  postCheckout,
  removeCartCoupon as removeCartCouponRequest,
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

export type FetchCartOptions = {
  /**
   * When true, an empty `GET /cart` overwrites a non-empty local cart (e.g. order just completed).
   * Default false: retry once and otherwise keep the last known cart when Woo briefly returns empty.
   */
  acceptEmptyWhenHadItems?: boolean;
};

type CartStoreActions = {
  setDrawerOpen: (open: boolean) => void;
  openCart: () => void;
  closeCart: () => void;
  fetchCart: (options?: FetchCartOptions) => Promise<void>;
  ensureCartLoaded: () => Promise<void>;
  addItem: (productId: number) => Promise<void>;
  updateItemQuantity: (key: string, quantity: number, productId?: number) => Promise<void>;
  removeItem: (key: string, productId?: number) => Promise<void>;
  selectShippingRate: (packageId: number, rateId: string) => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;
  submitCheckout: (payload: CheckoutPayload) => Promise<CheckoutOrderResult>;
};

export type CartStore = CartStoreState & CartStoreActions;

let ensureLoadPromise: Promise<void> | null = null;

export function getCartItemsCount(cart: CartResponse | null): number {
  if (!cart) {
    return 0;
  }
  const fromLines = cart.items.reduce((total, item) => total + item.quantity, 0);
  if (cart.items.length > 0) {
    return fromLines;
  }
  if (typeof cart.items_count === "number") {
    return cart.items_count;
  }
  return fromLines;
}

function cloneCart(cart: CartResponse): CartResponse {
  return structuredClone(cart);
}

/** When the line already exists (same product id), bump qty locally until the server responds. */
function optimisticIncrementLineForProduct(cart: CartResponse, productId: number): CartResponse | null {
  const line = cart.items.find((i) => i.id === productId);
  if (!line) {
    return null;
  }
  return {
    ...cart,
    items: cart.items.map((i) =>
      i.key === line.key ? { ...i, quantity: i.quantity + 1 } : i,
    ),
  };
}

function optimisticSetLineQuantity(cart: CartResponse, key: string, quantity: number): CartResponse {
  return {
    ...cart,
    items: cart.items.map((i) => (i.key === key ? { ...i, quantity } : i)),
  };
}

function optimisticRemoveLine(cart: CartResponse, key: string): CartResponse {
  return {
    ...cart,
    items: cart.items.filter((i) => i.key !== key),
  };
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

  fetchCart: async (options) => {
    const snapshot = get().cart;
    const acceptEmpty = options?.acceptEmptyWhenHadItems === true;
    const prevCount = getCartItemsCount(snapshot);
    const hadCartState = snapshot !== null;
    if (!hadCartState) {
      set({ status: "loading", error: null });
    }
    try {
      let cart = await getCart();
      let newCount = getCartItemsCount(cart);

      if (!acceptEmpty && prevCount > 0 && newCount === 0) {
        await new Promise((r) => setTimeout(r, 200));
        const retryCart = await getCart();
        const retryCount = getCartItemsCount(retryCart);
        if (retryCount > 0) {
          cart = retryCart;
          newCount = retryCount;
        } else if (snapshot) {
          set({ cart: snapshot, status: "ready", error: null });
          return;
        }
      }

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
    const cartBefore = get().cart;
    const snapshot = cartBefore !== null ? cloneCart(cartBefore) : null;
    set({ mutatingProductId: productId, error: null });
    if (snapshot) {
      const optimistic = optimisticIncrementLineForProduct(snapshot, productId);
      if (optimistic) {
        set({ cart: optimistic, status: "ready" });
      }
    }
    try {
      const cart = await addToCartRequest(productId);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      if (snapshot) {
        set({ cart: snapshot, status: "ready", error: message });
      } else {
        set({ error: message });
      }
      throw e;
    } finally {
      set({ mutatingProductId: null });
    }
  },

  updateItemQuantity: async (key, quantity, productId) => {
    await get().ensureCartLoaded();
    const fromCart = get().cart?.items.find((i) => i.key === key)?.id;
    const cartBefore = get().cart;
    const snapshot = cartBefore !== null ? cloneCart(cartBefore) : null;
    set({ mutatingProductId: productId ?? fromCart ?? null, error: null });
    if (snapshot) {
      set({ cart: optimisticSetLineQuantity(snapshot, key, quantity), status: "ready" });
    }
    try {
      const cart = await setCartItemQuantityRequest(key, quantity);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      if (snapshot) {
        set({ cart: snapshot, status: "ready", error: message });
      } else {
        set({ error: message });
      }
      throw e;
    } finally {
      set({ mutatingProductId: null });
    }
  },

  removeItem: async (key, productId) => {
    await get().ensureCartLoaded();
    const fromCart = get().cart?.items.find((i) => i.key === key)?.id;
    const cartBefore = get().cart;
    const snapshot = cartBefore !== null ? cloneCart(cartBefore) : null;
    set({ mutatingProductId: productId ?? fromCart ?? null, error: null });
    if (snapshot) {
      set({ cart: optimisticRemoveLine(snapshot, key), status: "ready" });
    }
    try {
      const cart = await removeCartItemRequest(key);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      if (snapshot) {
        set({ cart: snapshot, status: "ready", error: message });
      } else {
        set({ error: message });
      }
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

  applyCoupon: async (code) => {
    await get().ensureCartLoaded();
    set({ error: null });
    try {
      const cart = await applyCartCouponRequest(code);
      set({ cart, status: "ready", error: null });
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Unknown error" });
      throw e;
    }
  },

  removeCoupon: async (code) => {
    await get().ensureCartLoaded();
    set({ error: null });
    try {
      const cart = await removeCartCouponRequest(code);
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
      await get().fetchCart({ acceptEmptyWhenHadItems: true });
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      set({ checkoutError: message });
      throw e;
    }
  },
}));
