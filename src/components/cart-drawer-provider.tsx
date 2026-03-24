"use client";

import { CartDrawer } from "@/components/cart-drawer";
import { useCartStore } from "@/features/cart/store/cart-store";
import { useEffect, type ReactNode } from "react";

export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const ensureCartLoaded = useCartStore((s) => s.ensureCartLoaded);

  useEffect(() => {
    void ensureCartLoaded();
  }, [ensureCartLoaded]);

  return (
    <>
      {children}
      <CartDrawer />
    </>
  );
}
