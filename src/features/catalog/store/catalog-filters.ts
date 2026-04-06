"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type CatalogFilterState = {
  category: string;
  /** `pa_origine` term slugs. */
  origineSlugs: string[];
  /** `pa_regime` term slugs. */
  regimeSlugs: string[];
  setCategory: (value: string) => void;
  setOrigineSlugs: (value: string[]) => void;
  setRegimeSlugs: (value: string[]) => void;
  reset: () => void;
};

const defaults = {
  category: "",
  origineSlugs: [] as string[],
  regimeSlugs: [] as string[],
};

export const useCatalogFilterStore = create<CatalogFilterState>()(
  persist(
    (set) => ({
      ...defaults,
      setCategory: (category) => set({ category }),
      setOrigineSlugs: (origineSlugs) => set({ origineSlugs }),
      setRegimeSlugs: (regimeSlugs) => set({ regimeSlugs }),
      reset: () => set(defaults),
    }),
    {
      name: "catalog-filters-v2",
      partialize: (state) => ({
        category: state.category,
        origineSlugs: state.origineSlugs,
        regimeSlugs: state.regimeSlugs,
      }),
    },
  ),
);
