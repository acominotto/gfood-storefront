"use client";

import { Button } from "@/components/ui/button";
import { ProductImagePlaceholder } from "@/features/catalog/components/product-image-placeholder";
import { useCartStore } from "@/features/cart/store/cart-store";
import {
  cartItemImageProxy,
  cartItemUnitPriceMinor,
  formatCartMoney,
  type CartLineItem,
} from "@/lib/cart-format";
import { Box, HStack, IconButton, Image, Text, VStack } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { FiTrash2 } from "react-icons/fi";

type CartDrawerCartItemProps = {
  item: CartLineItem;
  cartCurrency: string | null | undefined;
  isLast: boolean;
};

export function CartDrawerCartItem({ item, cartCurrency, isLast }: CartDrawerCartItemProps) {
  const t = useTranslations("nav");
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const busy = useCartStore((s) => s.mutatingProductId !== null);

  const currency = item.prices?.currency_code ?? cartCurrency;
  const proxySrc = cartItemImageProxy(item);
  const lineTotalText = formatCartMoney(item.prices?.line_total, currency, locale);
  const unitMinor = cartItemUnitPriceMinor(item);
  const unitPriceText = unitMinor != null ? formatCartMoney(unitMinor, currency, locale) : null;
  return (
    <HStack
      align="flex-start"
      gap={3}
      pb={4}
      borderBottomWidth={isLast ? undefined : "1px"}
      borderColor="gray.100"
    >
      <Box
        flexShrink={0}
        w="72px"
        h="72px"
        bg="gray.100"
        rounded="md"
        overflow="hidden"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {proxySrc ? (
          <Image src={proxySrc} alt={item.name} w="full" h="full" objectFit="contain" />
        ) : (
          <Box w="full" h="full" display="flex" alignItems="center" justifyContent="center" p={1}>
            <ProductImagePlaceholder />
          </Box>
        )}
      </Box>
      <VStack align="stretch" flex="1" minW={0} gap={2}>
        <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
          {item.name}
        </Text>
        {unitPriceText != null && (item.quantity > 1 || lineTotalText === "-") ? (
          <Text fontSize="xs" color="gray.600">
            {item.quantity > 1
              ? t("cartLineUnitTimesQty", { unitPrice: unitPriceText, quantity: item.quantity })
              : t("cartUnitPrice", { price: unitPriceText })}
          </Text>
        ) : null}
        <HStack gap={2} flexWrap="wrap">
          <Button size="sm" disabled={busy} onClick={() => updateItemQuantity(item.key, item.quantity + 1, item.id)}>
            +
          </Button>
          <Text minW="24px" textAlign="center" fontSize="sm">
            {item.quantity}
          </Text>
          <Button
            size="sm"
            disabled={busy}
            onClick={() => {
              if (item.quantity <= 1) {
                return removeItem(item.key, item.id);
              }
              return updateItemQuantity(item.key, item.quantity - 1, item.id);
            }}
          >
            -
          </Button>
          <IconButton
            aria-label={tCatalog("removeFromCart")}
            size="sm"
            variant="outline"
            disabled={busy}
            onClick={() => removeItem(item.key, item.id)}
          >
            <FiTrash2 />
          </IconButton>
        </HStack>
      </VStack>
      {lineTotalText !== "-" ? (
        <Text
          fontSize="sm"
          fontWeight="bold"
          flexShrink={0}
          whiteSpace="nowrap"
          alignSelf="flex-start"
        >
          {lineTotalText}
        </Text>
      ) : null}
    </HStack>
  );
}
