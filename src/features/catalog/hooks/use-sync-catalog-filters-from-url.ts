"use client";

import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useNavbarStore } from "@/stores/navbar-store";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";

/**
 * Applies `?search=&category=&origine=&regime=` from the URL to the navbar search store and catalog filters
 * so links like `/?category=12` work (e.g. from the product breadcrumb).
 */
export function useSyncCatalogFiltersFromSearchParams() {
  const searchParams = useSearchParams();
  const setCategory = useCatalogFilterStore((s) => s.setCategory);
  const setOrigineSlugs = useCatalogFilterStore((s) => s.setOrigineSlugs);
  const setRegimeSlugs = useCatalogFilterStore((s) => s.setRegimeSlugs);
  const setCatalogSearch = useNavbarStore((s) => s.setCatalogSearch);

  useEffect(() => {
    const category = searchParams.get("category");
    setCategory(category ?? "");

    const origine = searchParams
      .getAll("origine")
      .flatMap((s) => s.split(","))
      .map((s) => s.trim())
      .filter(Boolean);
    setOrigineSlugs([...new Set(origine)]);

    const regime = searchParams
      .getAll("regime")
      .flatMap((s) => s.split(","))
      .map((s) => s.trim())
      .filter(Boolean);
    setRegimeSlugs([...new Set(regime)]);

    const search = searchParams.get("search");
    setCatalogSearch(search ?? "");
  }, [searchParams, setCategory, setOrigineSlugs, setRegimeSlugs, setCatalogSearch]);
}
