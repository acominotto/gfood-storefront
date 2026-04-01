"use client";

import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useProductsStore } from "@/features/catalog/store/products-store";
import { useNavbarStore } from "@/stores/navbar-store";
import { useEffect, useMemo, useState } from "react";

const SEARCH_DEBOUNCE_MS = 500;

export function useSyncCatalogProducts(perPage: number) {
  const category = useCatalogFilterStore((s) => s.category);
  const catalogSearch = useNavbarStore((s) => s.catalogSearch);
  const [appliedSearch, setAppliedSearch] = useState(catalogSearch);

  useEffect(() => {
    const id = window.setTimeout(() => setAppliedSearch(catalogSearch), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [catalogSearch]);

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams({
      perPage: String(perPage),
      orderBy: "title",
      order: "asc",
    });

    if (appliedSearch) {
      params.set("search", appliedSearch);
    }
    if (category) {
      params.set("category", category);
    }
    return params;
  }, [category, appliedSearch, perPage]);

  const signature = baseQuery.toString();
  const resetAndFetchFirstPage = useProductsStore((s) => s.resetAndFetchFirstPage);

  useEffect(() => {
    void resetAndFetchFirstPage(signature);
  }, [resetAndFetchFirstPage, signature]);

  return { appliedSearch };
}
