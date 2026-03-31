"use client";

import { useLayoutEffect, useState, type RefObject } from "react";

/**
 * Tracks an element's `offsetHeight` via `ResizeObserver`.
 */
export function useResizeObserverHeight(ref: RefObject<HTMLElement | null>) {
  const [height, setHeight] = useState(0);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const measure = () => setHeight(el.offsetHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [ref]);

  return height;
}
