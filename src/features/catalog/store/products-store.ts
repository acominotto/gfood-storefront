"use client";

import { getFacets, getProducts, type ProductResponse } from "@/features/catalog/api";
import { create } from "zustand";

export type FacetsResponse = Awaited<ReturnType<typeof getFacets>>;

type LoadStatus = "idle" | "loading" | "error";

type ProductsStoreState = {
  pages: ProductResponse[];
  /** Stable `URLSearchParams` string for list query (no `page`); identifies current filter + perPage. */
  querySignature: string | null;
  status: LoadStatus;
  isFetchingNextPage: boolean;
  error: string | null;

  facets: FacetsResponse | null;
  facetsStatus: LoadStatus;
  facetsError: string | null;
};

type ProductsStoreActions = {
  fetchFacets: () => Promise<void>;
  resetAndFetchFirstPage: (signature: string) => Promise<void>;
  fetchNextPage: () => Promise<void>;
};

export type ProductsStore = ProductsStoreState & ProductsStoreActions;

export const useProductsStore = create<ProductsStore>((set, get) => ({
  pages: [],
  querySignature: null,
  status: "idle",
  isFetchingNextPage: false,
  error: null,

  facets: null,
  facetsStatus: "idle",
  facetsError: null,

  fetchFacets: async () => {
    set({ facetsStatus: "loading", facetsError: null });
    try {
      const facets = await getFacets();
      set({ facets, facetsStatus: "idle", facetsError: null });
    } catch (e) {
      set({
        facetsStatus: "error",
        facetsError: e instanceof Error ? e.message : "Unknown error",
      });
    }
  },

  resetAndFetchFirstPage: async (signature) => {
    const state = get();
    if (state.querySignature === signature && state.pages.length > 0 && state.status === "idle") {
      return;
    }

    set({
      querySignature: signature,
      pages: [],
      status: "loading",
      error: null,
      isFetchingNextPage: false,
    });

    try {
      const params = new URLSearchParams(signature);
      params.set("page", "1");
      const first = await getProducts(params);
      if (get().querySignature !== signature) {
        return;
      }
      set({ pages: [first], status: "idle", error: null });
    } catch (e) {
      if (get().querySignature !== signature) {
        return;
      }
      set({
        status: "error",
        error: e instanceof Error ? e.message : "Unknown error",
        pages: [],
      });
    }
  },

  fetchNextPage: async () => {
    const { pages, querySignature, isFetchingNextPage, status } = get();
    if (!querySignature || isFetchingNextPage || status === "loading") {
      return;
    }
    const last = pages[pages.length - 1];
    if (!last || last.pagination.page >= last.pagination.totalPages) {
      return;
    }

    const sig = querySignature;
    set({ isFetchingNextPage: true, error: null });

    try {
      const params = new URLSearchParams(sig);
      params.set("page", String(last.pagination.page + 1));
      const next = await getProducts(params);
      if (get().querySignature !== sig) {
        return;
      }
      set((s) => ({
        pages: [...s.pages, next],
        isFetchingNextPage: false,
      }));
    } catch (e) {
      if (get().querySignature !== sig) {
        return;
      }
      set({
        isFetchingNextPage: false,
        error: e instanceof Error ? e.message : "Unknown error",
      });
    }
  },
}));

export function selectHasNextPage(state: ProductsStore): boolean {
  const last = state.pages[state.pages.length - 1];
  return Boolean(last && last.pagination.page < last.pagination.totalPages);
}
