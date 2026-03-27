"use client";

import { CartQuantityRow } from "@/components/cart-quantity-row";
import { Button } from "@/components/ui/button";
import { Link } from "@/components/ui/link";
import { useCartStore } from "@/features/cart/store/cart-store";
import { ProductImagePlaceholder } from "@/features/catalog/components/product-image-placeholder";
import { productPath } from "@/lib/product-url";
import type { Product } from "@/server/schemas/catalog";
import { Badge, Box, Card, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

type ProductCardProps = {
  product: Product;
  locale: string;
  onOpenCart?: () => void;
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
  const textarea = document.createElement("textarea");
  textarea.innerHTML = html;
  const decoded = textarea.value;
  return decoded.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function ProductCard({ product, locale, onOpenCart }: ProductCardProps) {
  const t = useTranslations("catalog");
  const line = useCartStore((s) => s.cart?.items.find((entry) => entry.id === product.id));
  const quantity = line?.quantity ?? 0;
  const cartItemKey = line?.key ?? null;
  const isUpdatingCart = useCartStore((s) => s.mutatingProductId === product.id);
  const addItem = useCartStore((s) => s.addItem);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const image = product.images[0];
  const src = image?.thumbnail ?? image?.src;
  const proxySrc = src
    ? `/api/images/${new URL(src, "https://g-food.ch").pathname.replace(/^\//, "")}?preset=thumb&q=72&fit=cover&bg=remove`
    : null;
  const translation = toPlainText(product.short_description);
  const canAddToCart = Boolean(product.is_in_stock) && product.is_purchasable;

  async function onAdd() {
    if (isUpdatingCart || !canAddToCart) return;
    await addItem(product.id);
  }

  async function onIncrease() {
    if (isUpdatingCart || !cartItemKey) return;
    await updateItemQuantity(cartItemKey, quantity + 1, product.id);
  }

  async function onDecrease() {
    if (isUpdatingCart || !cartItemKey) return;
    const nextQuantity = quantity - 1;
    if (nextQuantity <= 0) {
      await removeItem(cartItemKey, product.id);
      return;
    }
    await updateItemQuantity(cartItemKey, nextQuantity, product.id);
  }

  async function onRemove() {
    if (isUpdatingCart || !cartItemKey) return;
    await removeItem(cartItemKey, product.id);
  }

  return (
    <Card.Root
      borderWidth="1px"
      borderColor="gray.200"
      rounded="xl"
      cursor="pointer"
      bg="white"
      overflow="hidden"
      minW={0}
      h="full"
      display="flex"
      flexDirection="column"
      transition="all 0.2s ease"
      onClick={onOpenCart ? () => onOpenCart() : undefined}
      _hover={{ transform: "translateY(-2px)", shadow: "md" }}
    >
      <Card.Header p={0}>
        <Link
          href={productPath(product)}
          display="block"
          onClick={(e) => e.stopPropagation()}
          _hover={{ textDecoration: "none" }}
        >
          <Box bg="gray.100" w="full" aspectRatio={1} display="flex" alignItems="center" justifyContent="center">
            {proxySrc ? (
              <Image src={proxySrc} alt={product.name} w="full" h="full" objectFit="contain" />
            ) : (
              <Box role="img" aria-label={product.name} w="full" h="full" display="flex" alignItems="center" justifyContent="center">
                <ProductImagePlaceholder />
              </Box>
            )}
          </Box>
        </Link>
      </Card.Header>
      <Card.Body
        p={3}
        mt="-4"
        borderTopRadius="xl"
        bg="white"
        overflow="hidden"
        flex="1"
        minH={0}
        display="flex"
        flexDirection="column"
      >
        <Stack gap={2} flex="1" minH={0}>
          <Link
            href={productPath(product)}
            variant="plain"
            color="inherit"
            fontWeight="semibold"
            lineClamp={2}
            onClick={(e) => e.stopPropagation()}
            _hover={{ textDecoration: "underline" }}
          >
            {product.name}
          </Link>
          {translation ? (
            <Text fontSize="sm" color="gray.600" lineClamp={2}>
              {translation}
            </Text>
          ) : null}
        </Stack>
        <HStack justify="space-between" align="center" w="full" flexShrink={0} pt={2}>
          <Badge colorPalette={product.is_in_stock ? "green" : "red"} variant="subtle">
            {product.is_in_stock ? t("inStock") : t("outOfStock")}
          </Badge>
          <Text fontWeight="bold">{formatPrice(product.prices?.price, locale)}</Text>
        </HStack>
        <Box mt={3} flexShrink={0} onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          {quantity > 0 ? (
            <CartQuantityRow
              quantity={quantity}
              disabled={isUpdatingCart}
              onDecrease={() => onDecrease()}
              onIncrease={() => onIncrease()}
              onRemove={() => onRemove()}
              removeAriaLabel={t("removeFromCart")}
            />
          ) : (
            <Button
              size="sm"
              colorPalette="brand"
              borderRadius="full"
              onClick={() => onAdd()}
              disabled={!canAddToCart}
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
