"use client";

import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useProductsStore } from "@/features/catalog/store/products-store";
import { useNavbarStore } from "@/stores/navbar-store";
import { useEffect, useMemo } from "react";

export function useSyncCatalogProducts(perPage: number) {
  const category = useCatalogFilterStore((s) => s.category);
  const catalogSearch = useNavbarStore((s) => s.catalogSearch);

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams({
      perPage: String(perPage),
      orderBy: "title",
      order: "asc",
    });

    if (catalogSearch) {
      params.set("search", catalogSearch);
    }
    if (category) {
      params.set("category", category);
    }
    return params;
  }, [category, catalogSearch, perPage]);

  const signature = baseQuery.toString();
  const resetAndFetchFirstPage = useProductsStore((s) => s.resetAndFetchFirstPage);

  useEffect(() => {
    void resetAndFetchFirstPage(signature);
  }, [resetAndFetchFirstPage, signature]);
}
