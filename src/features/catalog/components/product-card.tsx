"use client";

import { CartQuantityRow } from "@/components/cart-quantity-row";
import { Link } from "@/components/ui/link";
import { useCartStore } from "@/features/cart/store/cart-store";
import { ProductImagePlaceholder } from "@/features/catalog/components/product-image-placeholder";
import { ProductPrice } from "@/features/catalog/components/product-price";
import { productPath } from "@/lib/product-url";
import type { Product } from "@/server/schemas/catalog";
import { Badge, Box, Card, HStack, IconButton, Image, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiShoppingCart } from "react-icons/fi";

type ProductCardProps = {
  product: Product;
  locale: string;
  onOpenCart?: () => void;
};

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
    ? `/api/images/${new URL(src, "https://g-food.ch").pathname.replace(/^\//, "")}?preset=thumb&q=72&fit=cover&bg=remove&format=webp`
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
      rounded="lg"
      cursor="pointer"
      bg="white"
      overflow="hidden"
      w="200px"
      maxW="200px"
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
        p={2}
        mt="-3"
        borderTopRadius="lg"
        bg="white"
        boxShadow="0 -2px 6px rgba(235, 32, 39, 0.15)"
        overflow="hidden"
        flex="1"
        minH={0}
        display="flex"
        flexDirection="column"
      >
        <Stack gap={1} flex="1" minH={0}>
          <Link
            href={productPath(product)}
            variant="plain"
            color="inherit"
            fontWeight="semibold"
            fontSize="xs"
            lineHeight="1.25"
            lineClamp={2}
            onClick={(e) => e.stopPropagation()}
            _hover={{ textDecoration: "underline" }}
          >
            {product.name}
          </Link>
          {translation ? (
            <Text fontSize="2xs" color="gray.600" lineClamp={2} lineHeight="1.25">
              {translation}
            </Text>
          ) : null}
          <Badge
            colorPalette={product.is_in_stock ? "green" : "red"}
            variant="subtle"
            w="fit-content"
            fontSize="2xs"
            px={1.5}
            py={0}
          >
            {product.is_in_stock ? t("inStock") : t("outOfStock")}
          </Badge>
        </Stack>
        <HStack
          justify="space-between"
          align="flex-end"
          w="full"
          flexShrink={0}
          pt={1.5}
          gap={1}
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
        >
          <ProductPrice product={product} locale={locale} size="sm" />
          <Box flexShrink={0}>
            {quantity > 0 ? (
              <CartQuantityRow
                quantity={quantity}
                disabled={isUpdatingCart}
                compact
                dense
                tight
                onDecrease={() => onDecrease()}
                onIncrease={() => onIncrease()}
                onRemove={() => onRemove()}
                removeAriaLabel={t("removeFromCart")}
              />
            ) : (
              <IconButton
                aria-label={t("addToCart")}
                size="xs"
                variant="outline"
                colorPalette="brand"
                rounded="full"
                disabled={!canAddToCart}
                loading={isUpdatingCart}
                onClick={() => void onAdd()}
              >
                <FiShoppingCart size={12} aria-hidden />
              </IconButton>
            )}
          </Box>
        </HStack>
      </Card.Body>
    </Card.Root>
  );
}
