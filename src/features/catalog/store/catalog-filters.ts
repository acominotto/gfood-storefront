"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CatalogFilterState = {
  category: string;
  setCategory: (value: string) => void;
  reset: () => void;
};

const defaults = {
  category: "",
};

export const useCatalogFilterStore = create<CatalogFilterState>()(
  persist(
    (set) => ({
      ...defaults,
      setCategory: (category) => set({ category }),
      reset: () => set(defaults),
    }),
    {
      name: "catalog-filters",
      partialize: (state) => ({ category: state.category }),
    },
  ),
);
