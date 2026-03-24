"use client";

import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useProductsStore } from "@/features/catalog/store/products-store";
import { useEffect, useMemo } from "react";

export function useSyncCatalogProducts(perPage: number) {
  const { search, category, minPrice, maxPrice, inStock } = useCatalogFilterStore();

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams({
      perPage: String(perPage),
      orderBy: "title",
      order: "asc",
    });

    if (search) {
      params.set("search", search);
    }
    if (category) {
      params.set("category", category);
    }
    if (minPrice) {
      params.set("minPrice", minPrice);
    }
    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    }
    if (inStock) {
      params.set("inStock", "true");
    }
    return params;
  }, [category, inStock, maxPrice, minPrice, perPage, search]);

  const signature = baseQuery.toString();
  const resetAndFetchFirstPage = useProductsStore((s) => s.resetAndFetchFirstPage);

  useEffect(() => {
    void resetAndFetchFirstPage(signature);
  }, [resetAndFetchFirstPage, signature]);
}
