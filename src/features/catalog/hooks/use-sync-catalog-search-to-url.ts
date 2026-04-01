"use client";

import { useNavbarStore } from "@/stores/navbar-store";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";

const DEBOUNCE_MS = 500;

/**
 * Writes the navbar catalog search string to the `search` query param (debounced).
 * Clears `page` when search changes so results reset.
 */
export function useSyncCatalogSearchToUrl() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const catalogSearch = useNavbarStore((s) => s.catalogSearch);

  useEffect(() => {
    const fromUrl = searchParams.get("search") ?? "";
    if (catalogSearch === fromUrl) {
      return;
    }
    const id = window.setTimeout(() => {
      const p = new URLSearchParams(searchParams.toString());
      p.delete("page");
      if (catalogSearch) {
        p.set("search", catalogSearch);
      } else {
        p.delete("search");
      }
      const qs = p.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(id);
  }, [catalogSearch, router, searchParams]);
}
