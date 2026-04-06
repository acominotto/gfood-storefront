"use client";

import { useEffect, useRef, useState } from "react";

type UseScrollRevealBarOptions = {
  /**
   * How much the user must scroll in one direction (accumulated across slow
   * scroll events) before toggling visibility. Larger values reduce flicker.
   */
  threshold?: number;
  /** While scrollY is at or below this value, the bar stays visible */
  scrollTopAlwaysVisible?: number;
  /**
   * After showing or hiding, ignore further visibility toggles for this long so
   * layout / scroll anchoring cannot bounce the bar back immediately.
   */
  toggleCooldownMs?: number;
};

/**
 * Hide on scroll down, show on scroll up (and when near top of page).
 */
export function useScrollRevealBar(options: UseScrollRevealBarOptions = {}) {
  const { threshold = 18, scrollTopAlwaysVisible = 32, toggleCooldownMs = 280 } = options;
  const [visible, setVisible] = useState(true);
  const lastY = useRef(0);
  const frame = useRef<number | null>(null);
  const accumulated = useRef(0);
  const cooldownUntil = useRef(0);

  useEffect(() => {
    lastY.current = window.scrollY;
    accumulated.current = 0;

    const onScroll = () => {
      if (frame.current != null) return;
      frame.current = requestAnimationFrame(() => {
        frame.current = null;
        const y = window.scrollY;
        const now = performance.now();

        if (y <= scrollTopAlwaysVisible) {
          setVisible(true);
          lastY.current = y;
          accumulated.current = 0;
          cooldownUntil.current = 0;
          return;
        }

        if (now < cooldownUntil.current) {
          lastY.current = y;
          accumulated.current = 0;
          return;
        }

        const dy = y - lastY.current;
        lastY.current = y;

        if (Math.abs(dy) < 0.5) {
          return;
        }

        if (accumulated.current !== 0 && Math.sign(dy) !== Math.sign(accumulated.current)) {
          accumulated.current = 0;
        }
        accumulated.current += dy;

        if (accumulated.current > threshold) {
          setVisible((prev) => {
            accumulated.current = 0;
            if (!prev) {
              return prev;
            }
            cooldownUntil.current = now + toggleCooldownMs;
            return false;
          });
          return;
        }
        if (accumulated.current < -threshold) {
          setVisible((prev) => {
            accumulated.current = 0;
            if (prev) {
              return prev;
            }
            cooldownUntil.current = now + toggleCooldownMs;
            return true;
          });
        }
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame.current != null) {
        cancelAnimationFrame(frame.current);
      }
    };
  }, [threshold, scrollTopAlwaysVisible, toggleCooldownMs]);

  return visible;
}
