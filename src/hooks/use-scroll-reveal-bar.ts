"use client";

import { useEffect, useRef, useState } from "react";

type UseScrollRevealBarOptions = {
  /** Minimum scroll delta (px) to treat as intentional direction change */
  delta?: number;
  /** While scrollY is at or below this value, the bar stays visible */
  scrollTopAlwaysVisible?: number;
};

/**
 * Hide on scroll down, show on scroll up (and when near top of page).
 */
export function useScrollRevealBar(options: UseScrollRevealBarOptions = {}) {
  const { delta = 8, scrollTopAlwaysVisible = 32 } = options;
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    lastY.current = window.scrollY;

    const onScroll = () => {
      if (frame.current != null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const y = window.scrollY;
        if (y <= scrollTopAlwaysVisible) {
          setVisible(true);
          lastY.current = y;
          return;
        }
        const dy = y - lastY.current;
        if (dy > delta) {
          setVisible(false);
        } else if (dy < -delta) {
          setVisible(true);
        }
        lastY.current = y;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [delta, scrollTopAlwaysVisible]);

  return visible;
}
