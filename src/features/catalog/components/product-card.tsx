"use client";

import { addToCart, removeCartItem, setCartItemQuantity } from "@/features/catalog/api";
import type { CartResponse } from "@/server/schemas/cart";
import type { Product } from "@/server/schemas/catalog";
import { Badge, Box, Button, Card, HStack, IconButton, Image, Stack, Text } from "@chakra-ui/react";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FiTrash2 } from "react-icons/fi";

type ProductCardProps = {
  product: Product;
  locale: string;
};

function formatPrice(amount: string | undefined, locale: string) {
  if (!amount) {
    return "-";
  }
  const value = Number(amount) / 100;
  return new Intl.NumberFormat(locale, { style: "currency", currency: "CHF" }).format(value);
}

function toPlainText(html: string | undefined) {
  if (!html) {
    return "";
  }
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function ProductCard({ product, locale }: ProductCardProps) {
  const t = useTranslations("catalog");
  const queryClient = useQueryClient();
  const image = product.images[0];
  const src = image?.thumbnail ?? image?.src;
  const proxySrc = src
    ? `/api/images/${new URL(src, "https://g-food.ch").pathname.replace(/^\//, "")}?preset=thumb&q=72&fit=cover&bg=remove`
    : "/product-placeholder.svg";
  const translation = toPlainText(product.short_description);
  const canAddToCart = Boolean(product.is_in_stock) && product.is_purchasable;
  const [quantity, setQuantity] = useState(0);
  const [cartItemKey, setCartItemKey] = useState<string | null>(null);
  const [isUpdatingCart, setIsUpdatingCart] = useState(false);

  function syncItemState(cart: CartResponse, fallbackQuantity = 0) {
    const item = cart.items.find((entry) => entry.id === product.id);
    setQuantity(item?.quantity ?? fallbackQuantity);
    setCartItemKey(item?.key ?? null);
    queryClient.setQueryData(["cart"], cart);
  }

  async function onAdd() {
    if (isUpdatingCart || !canAddToCart) return;
    setIsUpdatingCart(true);
    try {
      const cart = await addToCart(product.id);
      syncItemState(cart, 1);
    } finally {
      setIsUpdatingCart(false);
    }
  }

  async function onIncrease() {
    if (isUpdatingCart || !cartItemKey) return;
    setIsUpdatingCart(true);
    try {
      const nextQuantity = quantity + 1;
      const cart = await setCartItemQuantity(cartItemKey, nextQuantity);
      syncItemState(cart, nextQuantity);
    } finally {
      setIsUpdatingCart(false);
    }
  }

  async function onDecrease() {
    if (isUpdatingCart || !cartItemKey) return;
    setIsUpdatingCart(true);
    try {
      const nextQuantity = quantity - 1;
      if (nextQuantity <= 0) {
        const cart = await removeCartItem(cartItemKey);
        syncItemState(cart, 0);
        return;
      }
      const cart = await setCartItemQuantity(cartItemKey, nextQuantity);
      syncItemState(cart, nextQuantity);
    } finally {
      setIsUpdatingCart(false);
    }
  }

  async function onRemove() {
    if (isUpdatingCart || !cartItemKey) return;
    setIsUpdatingCart(true);
    try {
      const cart = await removeCartItem(cartItemKey);
      syncItemState(cart, 0);
    } finally {
      setIsUpdatingCart(false);
    }
  }

  return (
    <Card.Root
      borderWidth="1px"
      borderColor="gray.200"
      rounded="xl"
      bg="white"
      overflow="hidden"
      minW={0}
      h="full"
      transition="all 0.2s ease"
      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
    >
      <Card.Header p={0}>
        <Box bg="gray.100" w="full" aspectRatio={4 / 5} display="flex" alignItems="center" justifyContent="center">
          <Image src={proxySrc} alt={product.name} w="full" h="full" objectFit="contain" />
        </Box>
      </Card.Header>
      <Card.Body p='4' mt='-4' borderTopRadius='xl' bg='white' overflow='hidden' h="full" display="flex" flexDirection="column">
        <Stack gap={2} flex="1">
          <Text fontWeight="semibold" lineClamp={2}>
            {product.name}
          </Text>
          {translation ? (
            <Text fontSize="sm" color="gray.600" lineClamp={2}>
              {translation}
            </Text>
          ) : null}
          <HStack justify="space-between">
            <Badge colorPalette="gray" variant="subtle">
              {product.is_in_stock ? "In stock" : "Out of stock"}
            </Badge>
            <Text>{formatPrice(product.prices?.price, locale)}</Text>
          </HStack>
        </Stack>
        <Box mt={3}>
          {quantity > 0 ? (
            <HStack gap={2}>
              <Button size="sm" onClick={() => void onDecrease()} variant="outline" disabled={isUpdatingCart}>
                -
              </Button>
              <Text minW="24px" textAlign="center" fontWeight="semibold" flex='1'>
                {quantity}
              </Text>
              <Button size="sm" variant="outline" onClick={() => void onIncrease()} disabled={isUpdatingCart}>
                +
              </Button>
              <IconButton
                aria-label={t("removeFromCart")}
                size="sm"
                variant="outline"
                colorPalette="gray"
                onClick={() => void onRemove()}
                disabled={isUpdatingCart}
              >
                <FiTrash2 />
              </IconButton>
            </HStack>
          ) : (
            <Button
              size="sm"
              onClick={() => void onAdd()}
              disabled={!canAddToCart}
              loading={isUpdatingCart}
              w="full"
            >
              {t("addToCart")}
            </Button>
          )}
        </Box>
      </Card.Body>
    </Card.Root>
  );
}
