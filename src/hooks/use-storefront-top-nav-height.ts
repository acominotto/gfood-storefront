"use client";

import { useLayoutEffect, useState } from "react";

const TOP_NAV_SELECTOR = "[data-storefront-top-nav]";

/**
 * Live height of the sticky top nav (px), for positioning fixed UI (e.g. catalog filter bar) directly below it.
 * Returns 0 before the first measurement (no bogus rem guesses per breakpoint).
 */
export function useStorefrontTopNavHeight() {
  const [heightPx, setHeightPx] = useState(0);

  useLayoutEffect(() => {
    const el = document.querySelector(TOP_NAV_SELECTOR);
    if (!el || !(el instanceof HTMLElement)) {
      return;
    }

    const measure = () => setHeightPx(el.offsetHeight);

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener("resize", measure, { passive: true });
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  return heightPx;
}
