"use client";

import { Button } from "@/components/ui/button";
import { getCartItemsCount, useCartStore } from "@/features/cart/store/cart-store";
import { Badge, Box, IconButton } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiShoppingCart } from "react-icons/fi";

type NavCartButtonProps = {
  compact?: boolean;
};

export function NavCartButton({ compact = false }: NavCartButtonProps) {
  const t = useTranslations("nav");
  const openCart = useCartStore((s) => s.openCart);
  const cart = useCartStore((s) => s.cart);
  const itemsCount = getCartItemsCount(cart);

  const badge = (
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
  );

  if (compact) {
    return (
      <Box position="relative" display="inline-block">
        <IconButton
          type="button"
          aria-label={t("cart")}
          aria-haspopup="dialog"
          onClick={() => openCart()}
          variant="outline"
          colorPalette="brand"
          bg="white"
          size="md"
          rounded="lg"
        >
          <FiShoppingCart size={22} />
        </IconButton>
        {badge}
      </Box>
    );
  }

  return (
    <Box position="relative" display="inline-block">
      <Button
        type="button"
        size="sm"
        colorPalette="brand"
        variant="outline"
        bg="white"
        _dark={{ bg: "brand.900" }}
        aria-haspopup="dialog"
        onClick={() => openCart()}
      >
        <FiShoppingCart />
        {t("cart")}
      </Button>
      {badge}
    </Box>
  );
}
