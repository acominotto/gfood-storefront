"use client";

import { CartDrawerProvider } from "@/components/cart-drawer-provider";
import { CookieConsentRoot } from "@/features/cookie-consent/cookie-consent-dialog";
import { ChakraProvider } from "@chakra-ui/react";

import { system } from "@/theme";
import { SessionProvider } from "next-auth/react";

type Props = {
  children: React.ReactNode;
};

export function AppProviders({ children }: Props) {
  return (
    <SessionProvider>
      <ChakraProvider value={system}>
        <CartDrawerProvider>
          {children}
          <CookieConsentRoot />
        </CartDrawerProvider>
      </ChakraProvider>
    </SessionProvider>
  );
}
