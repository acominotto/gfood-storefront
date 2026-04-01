"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Tracks an element's `clientWidth` via `ResizeObserver`.
 */
export function useResizeObserverWidth(ref: RefObject<HTMLElement | null>) {
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const measure = () => setWidth(el.clientWidth);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return width;
}
