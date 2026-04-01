"use client";

import { Button } from "@/components/ui/button";
import { getCartItemsCount, useCartStore } from "@/features/cart/store/cart-store";
import { Badge, Box, Button as ChakraButton, HStack, IconButton, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiShoppingCart } from "react-icons/fi";

type NavCartButtonProps = {
  compact?: boolean;
  variant?: "default" | "bottomNav";
};

export function NavCartButton({ compact = false, variant = "default" }: NavCartButtonProps) {
  const t = useTranslations("nav");
  const openCart = useCartStore((s) => s.openCart);
  const cart = useCartStore((s) => s.cart);
  const itemsCount = getCartItemsCount(cart);
  const cartAria = t("cartAriaWithCount", { count: itemsCount });

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

  if (variant === "bottomNav") {
    return (
      <ChakraButton
        type="button"
        variant="ghost"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        gap={0.5}
        flex="1"
        minH="12"
        minW={0}
        w="full"
        h="auto"
        py={2}
        px={1}
        rounded="md"
        color="fg.muted"
        aria-label={cartAria}
        aria-haspopup="dialog"
        onClick={() => openCart()}
      >
        <HStack gap={1.5} align="center">
          <FiShoppingCart size={22} aria-hidden />
          <Text fontSize="sm" fontWeight="bold" fontVariantNumeric="tabular-nums" lineHeight="1" color="fg">
            {itemsCount}
          </Text>
        </HStack>
        <Text fontSize="xs" lineHeight="short" fontWeight="medium">
          {t("cart")}
        </Text>
      </ChakraButton>
    );
  }

  if (compact) {
    return (
      <Box position="relative" display="inline-block">
        <IconButton
          type="button"
          aria-label={cartAria}
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
        aria-label={cartAria}
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
