"use client";

import { CartDeliveryLine } from "@/components/cart-delivery-line";
import { CartDrawerCartItem } from "@/components/cart-drawer-cart-item";
import { CartDrawerFeeLine } from "@/components/cart-drawer-fee-line";
import { FreeShippingProgress } from "@/features/cart/components/free-shipping-progress";
import { getCartItemsCount, useCartStore } from "@/features/cart/store/cart-store";
import { formatCartMoney } from "@/lib/cart-format";
import {
  Box,
  Button,
  EmptyState,
  Flex,
  HStack,
  Spinner,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { FiShoppingCart } from "react-icons/fi";
import { Drawer } from "./ui/drawer";
import { Link } from "./ui/link";

export function CartDrawer() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const drawerOpen = useCartStore((s) => s.drawerOpen);
  const setDrawerOpen = useCartStore((s) => s.setDrawerOpen);
  const cart = useCartStore((s) => s.cart);
  const status = useCartStore((s) => s.status);

  const cartItems = cart?.items ?? [];
  const cartFees = cart?.fees ?? [];
  const itemsCount = getCartItemsCount(cart);
  const totalText = formatCartMoney(cart?.totals?.total_price, cart?.totals?.currency_code, locale);
  const showInitialSpinner = status === "loading" && cart === null;

  return (
    <Drawer.Root
      open={drawerOpen}
      onOpenChange={(e) => setDrawerOpen(e.open)}
      placement="end"
      size="md"
    >
      <Drawer.Content>
        <Drawer.Header borderBottomWidth="1px" borderColor="gray.200" position="relative">
          <Drawer.CloseTrigger aria-label={t("closeDrawer")} />
          <Stack gap={0} flex="1" minW={0} pe="10">
            <Drawer.Title>{t("cart")}</Drawer.Title>
            <Text fontSize="sm" color="gray.600">
              {itemsCount} {t("items")}
            </Text>
          </Stack>
        </Drawer.Header>

        <Drawer.Body>
          {!showInitialSpinner && cart && cartItems.length > 0 ? (
            <Box pb={3}>
              <FreeShippingProgress />
            </Box>
          ) : null}

          {showInitialSpinner ? (
            <Flex gap={2} align="center" py={8} justify="center">
              <Spinner size="sm" />
              <Text fontSize="sm">{t("cartLoading")}</Text>
            </Flex>
          ) : null}

          {!showInitialSpinner && !cart && status === "error" ? (
            <Text fontSize="sm" color="gray.700" py={4}>
              {t("cartError")}
            </Text>
          ) : null}

          {!showInitialSpinner && cart && cartItems.length === 0 ? (
            <EmptyState.Root py={10}>
              <EmptyState.Content>
                <EmptyState.Indicator>
                  <FiShoppingCart size={28} />
                </EmptyState.Indicator>
                <VStack textAlign="center" gap={1}>
                  <EmptyState.Title>{t("cartEmpty")}</EmptyState.Title>
                  <EmptyState.Description>{t("cartEmptyDescription")}</EmptyState.Description>
                </VStack>
              </EmptyState.Content>
            </EmptyState.Root>
          ) : null}

          {!showInitialSpinner && cart && cartItems.length > 0 ? (
            <Stack gap={0} maxH="calc(100vh - 220px)" overflowY="auto" pb={2}>
              {cartItems.map((item, index) => (
                <CartDrawerCartItem
                  key={item.key}
                  item={item}
                  cartCurrency={cart.totals?.currency_code}
                  isLast={index === cartItems.length - 1 && cartFees.length === 0}
                />
              ))}
              {cartFees.map((fee, index) => (
                <CartDrawerFeeLine
                  key={fee.key}
                  fee={fee}
                  cartCurrency={cart.totals?.currency_code}
                  isLast={index === cartFees.length - 1}
                />
              ))}
            </Stack>
          ) : null}
        </Drawer.Body>

        {cart && cartItems.length > 0 ? (
          <Drawer.Footer borderTopWidth="1px" borderColor="gray.200" flexDirection="column" alignItems="stretch" gap={3}>
            <Stack gap={2} w="full">
              <CartDeliveryLine
                label={t("delivery")}
                amountMinor={cart.totals?.total_shipping}
                currency={cart.totals?.currency_code}
              />
              <HStack justify="space-between">
                <Text fontWeight="semibold">{t("total")}</Text>
                <Text fontWeight="bold">{totalText}</Text>
              </HStack>
            </Stack>
            <HStack justify="space-between" flexWrap="wrap" gap={2}>
              <Button asChild variant="outline" size="sm" flex="1">
                <Link href="/cart">{t("viewCart")}</Link>
              </Button>
              <Button asChild colorPalette="brand" size="sm" flex="1">
                <Link href="/checkout">{t("goToCheckout")}</Link>
              </Button>
            </HStack>
          </Drawer.Footer>
        ) : null}
      </Drawer.Content>
    </Drawer.Root>
  );
}
