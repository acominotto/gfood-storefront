"use client";

import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Applies `?search=&category=&minPrice=&maxPrice=&inStock=` to the catalog filter store
 * when present so links like `/?category=12` work (e.g. from the product breadcrumb).
 * Params omitted from the URL are left unchanged so persisted store values still apply.
 */
export function useSyncCatalogFiltersFromSearchParams() {
  const searchParams = useSearchParams();
  const setField = useCatalogFilterStore((s) => s.setField);

  useEffect(() => {
    const category = searchParams.get("category");
    if (category !== null) {
      setField("category", category);
    }

    const search = searchParams.get("search");
    if (search !== null) {
      setField("search", search);
    }

    const minPrice = searchParams.get("minPrice");
    if (minPrice !== null) {
      setField("minPrice", minPrice);
    }

    const maxPrice = searchParams.get("maxPrice");
    if (maxPrice !== null) {
      setField("maxPrice", maxPrice);
    }

    const inStock = searchParams.get("inStock");
    if (inStock !== null) {
      setField("inStock", inStock === "true" || inStock === "1");
    }
  }, [searchParams, setField]);
}
