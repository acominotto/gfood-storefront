"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CatalogFilterState = {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  setField: (field: keyof Omit<CatalogFilterState, "setField" | "reset">, value: string | boolean) => void;
  reset: () => void;
};

const defaults = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
};

export const useCatalogFilterStore = create<CatalogFilterState>()(
  persist(
    (set) => ({
      ...defaults,
      setField: (field, value) => set(() => ({ [field]: value })),
      reset: () => set(defaults),
    }),
    {
      name: "catalog-filters",
    },
  ),
);
