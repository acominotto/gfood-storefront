"use client";

import { Button } from "@/components/ui/button";
import { getCartItemsCount, useCartStore } from "@/features/cart/store/cart-store";
import { Badge, Box } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiShoppingCart } from "react-icons/fi";

export function NavCartButton() {
  const t = useTranslations("nav");
  const openCart = useCartStore((s) => s.openCart);
  const cart = useCartStore((s) => s.cart);
  const itemsCount = getCartItemsCount(cart);

  return (
    <Box position="relative" display="inline-block">
      <Button
        type="button"
        size="sm"
        colorPalette="brand"
        variant="outline"
        bg="white"
        _dark={{ bg: "brand.900" }}
        aria-label={t("cart")}
        aria-haspopup="dialog"
        onClick={() => openCart()}
      >
        <FiShoppingCart />
        {t("cart")}
      </Button>
      <Badge
        position="absolute"
        top="-1.5"
        right="-1.5"
        colorPalette="brand"
        rounded="full"
        minW="20px"
        h="20px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={1}
        fontSize="xs"
      >
        {itemsCount}
      </Badge>
    </Box>
  );
}
