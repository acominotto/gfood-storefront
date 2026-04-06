"use client";

import { CartDrawer } from "@/components/cart-drawer";
import { useCartStore } from "@/features/cart/store/cart-store";
import { usePathname } from "@/i18n/navigation";
import { useEffect, useRef, type ReactNode } from "react";

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const ensureCartLoaded = useCartStore((s) => s.ensureCartLoaded);
  const fetchCart = useCartStore((s) => s.fetchCart);
  const pathname = usePathname();
  const skipNextPathSync = useRef(true);

  useEffect(() => {
    void ensureCartLoaded();
  }, [ensureCartLoaded]);

  useEffect(() => {
    if (skipNextPathSync.current) {
      skipNextPathSync.current = false;
      return;
    }
    void fetchCart();
  }, [pathname, fetchCart]);

  return (
    <>
      {children}
      <CartDrawer />
    </>
  );
}
