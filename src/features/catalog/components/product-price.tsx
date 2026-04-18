"use client";

import { formatProductPrice, getProductPromotionInfo } from "@/lib/product-price";
import type { Product } from "@/server/schemas/catalog";
import { Box, Stack, Text } from "@chakra-ui/react";

type Size = "sm" | "lg";

type ProductPriceProps = {
  product: Product;
  locale: string;
  size?: Size;
};

export function ProductPrice({ product, locale, size = "sm" }: ProductPriceProps) {
  const { onSale, currentMinor, regularMinor, currency } = getProductPromotionInfo(product);
  const currentLabel = formatProductPrice(currentMinor, locale, currency);

  if (!onSale) {
    return (
      <Text fontWeight="bold" fontSize={size === "lg" ? "2xl" : "sm"} lineHeight="1.2" lineClamp={1}>
        {currentLabel}
      </Text>
    );
  }

  const regularLabel = formatProductPrice(regularMinor, locale, currency);

  return (
    <Stack gap={0.5} align="flex-start" minW={0}>
      <Text
        as="span"
        fontSize={size === "lg" ? "md" : "2xs"}
        color="gray.500"
        textDecoration="line-through"
        lineHeight="1"
      >
        {regularLabel}
      </Text>
      <Box
        bg="brand.solid"
        color="white"
        px={size === "lg" ? 3 : 2}
        py={size === "lg" ? 1.5 : 0.5}
        rounded="md"
        lineHeight="1"
      >
        <Text as="span" fontWeight="bold" fontSize={size === "lg" ? "3xl" : "md"} lineHeight="1">
          {currentLabel}
        </Text>
      </Box>
    </Stack>
  );
}
