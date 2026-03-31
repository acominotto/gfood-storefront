"use client";

import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useNavbarStore } from "@/stores/navbar-store";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Applies `?search=&category=` from the URL to the navbar search store and catalog category store
 * so links like `/?category=12` work (e.g. from the product breadcrumb).
 */
export function useSyncCatalogFiltersFromSearchParams() {
  const searchParams = useSearchParams();
  const setCategory = useCatalogFilterStore((s) => s.setCategory);
  const setCatalogSearch = useNavbarStore((s) => s.setCatalogSearch);

  useEffect(() => {
    const category = searchParams.get("category");
    setCategory(category ?? "");

    const search = searchParams.get("search");
    setCatalogSearch(search ?? "");
  }, [searchParams, setCategory, setCatalogSearch]);
}
