"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CatalogFilterState = {
  search: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  /** Ephemeral: combobox typeahead (not persisted). Cleared whenever `category` is set. */
  categoryComboboxFilter: string;
  setField: (field: keyof Omit<CatalogFilterState, "setField" | "reset" | "setCategoryComboboxFilter">, value: string | boolean) => void;
  setCategoryComboboxFilter: (value: string) => void;
  reset: () => void;
};

const defaults = {
  search: "",
  category: "",
  minPrice: "",
  maxPrice: "",
  inStock: false,
  categoryComboboxFilter: "",
};

export const useCatalogFilterStore = create<CatalogFilterState>()(
  persist(
    (set) => ({
      ...defaults,
      setField: (field, value) =>
        set((prev) => ({
          ...prev,
          [field]: value,
          ...(field === "category" ? { categoryComboboxFilter: "" } : {}),
        })),
      setCategoryComboboxFilter: (value) => set({ categoryComboboxFilter: value }),
      reset: () => set(defaults),
    }),
    {
      name: "catalog-filters",
      partialize: (state) => ({
        search: state.search,
        category: state.category,
        minPrice: state.minPrice,
        maxPrice: state.maxPrice,
        inStock: state.inStock,
      }),
    },
  ),
);
