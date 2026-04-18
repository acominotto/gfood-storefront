"use client";

import { Button } from "@/components/ui/button";
import { CartQuantityRow } from "@/components/cart-quantity-row";
import { ProductCategoryBreadcrumb } from "@/features/catalog/components/product-category-breadcrumb";
import { ProductImagePlaceholder } from "@/features/catalog/components/product-image-placeholder";
import { ProductPrice } from "@/features/catalog/components/product-price";
import { useCartStore } from "@/features/cart/store/cart-store";
import type { RegimeTerm } from "@/lib/regime-term";
import type { Category, Product } from "@/server/schemas/catalog";
import { Badge, Box, Grid, Heading, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

type ProductDetailViewProps = {
  product: Product;
  locale: string;
  categories: Category[];
  /** `pa_origine` terms; computed on the server. */
  origineTerms?: RegimeTerm[];
  /** `pa_regime` (diet) terms; computed on the server. */
  regimeTerms?: RegimeTerm[];
};

function imageProxyUrl(src: string, opts: { thumb?: boolean }) {
  const params = new URLSearchParams({
    q: opts.thumb ? "72" : "82",
    fit: opts.thumb ? "cover" : "contain",
    bg: "remove",
    format: "webp",
  });
  if (opts.thumb) {
    params.set("preset", "thumb");
  }
  return `/api/images/${new URL(src, "https://g-food.ch").pathname.replace(/^\//, "")}?${params.toString()}`;
}

export function ProductDetailView({
  product,
  locale,
  categories,
  origineTerms = [],
  regimeTerms = [],
}: ProductDetailViewProps) {
  const t = useTranslations("catalog");
  const tNav = useTranslations("nav");
  const line = useCartStore((s) => s.cart?.items.find((entry) => entry.id === product.id));
  const quantity = line?.quantity ?? 0;
  const cartItemKey = line?.key ?? null;
  const isUpdatingCart = useCartStore((s) => s.mutatingProductId === product.id);
  const addItem = useCartStore((s) => s.addItem);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const openCart = useCartStore((s) => s.openCart);

  const images = product.images;
  const mainSrc = images[0]?.src;
  const mainProxy = mainSrc ? imageProxyUrl(mainSrc, { thumb: false }) : null;

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
    <Stack gap={{ base: 6, md: 8 }} minW={0} maxW="100%">
      <ProductCategoryBreadcrumb product={product} categories={categories} locale={locale} />

      <Grid
        templateColumns={{ base: "1fr", lg: "minmax(0, 1fr) minmax(0, 1fr)" }}
        gap={{ base: 6, md: 10 }}
        alignItems="start"
      >
        <Stack gap={4} minW={0}>
          <Box
            bg="gray.100"
            rounded="2xl"
            overflow="hidden"
            aspectRatio={1}
            maxH={{ lg: "min(80vh, 560px)" }}
            display="flex"
            alignItems="center"
            justifyContent="center"
          >
            {mainProxy ? (
              <Image src={mainProxy} alt={images[0]?.alt ?? product.name} w="full" h="full" objectFit="contain" />
            ) : (
              <Box
                role="img"
                aria-label={product.name}
                w="full"
                h="full"
                minH="240px"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <ProductImagePlaceholder />
              </Box>
            )}
          </Box>
          {images.length > 1 ? (
            <HStack gap={2} flexWrap="wrap">
              {images.slice(1, 6).map((img) => (
                <Box
                  key={img.id}
                  w="72px"
                  h="72px"
                  rounded="md"
                  overflow="hidden"
                  bg="gray.100"
                  flexShrink={0}
                >
                  <Image
                    src={imageProxyUrl(img.src, { thumb: true })}
                    alt={img.alt ?? product.name}
                    w="full"
                    h="full"
                    objectFit="contain"
                  />
                </Box>
              ))}
            </HStack>
          ) : null}
        </Stack>

        <Stack gap={4} minW={0}>
          <Heading as="h1" size="2xl" color="gray.900">
            {product.name}
          </Heading>
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
            <Badge colorPalette={product.is_in_stock ? "green" : "red"} variant="subtle" fontSize="sm">
              {product.is_in_stock ? t("inStock") : t("outOfStock")}
            </Badge>
            <ProductPrice product={product} locale={locale} size="lg" />
          </HStack>
          {origineTerms.length > 0 ? (
            <Stack gap={2} align="start">
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                {t("origineSectionTitle")}
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {origineTerms.map((term) => (
                  <Badge key={`o-${term.slug}`} colorPalette="blue" variant="outline" fontSize="sm">
                    {term.name}
                  </Badge>
                ))}
              </HStack>
            </Stack>
          ) : null}
          {regimeTerms.length > 0 ? (
            <Stack gap={2} align="start">
              <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                {t("regimeSectionTitle")}
              </Text>
              <HStack gap={2} flexWrap="wrap">
                {regimeTerms.map((term) => (
                  <Badge key={`r-${term.slug}`} colorPalette="brand" variant="outline" fontSize="sm">
                    {term.name}
                  </Badge>
                ))}
              </HStack>
            </Stack>
          ) : null}
          {product.short_description ? (
            <Box
              fontSize="md"
              color="gray.700"
              lineHeight="tall"
              css={{
                "& p": { marginBottom: "0.75rem" },
                "& p:last-of-type": { marginBottom: 0 },
              }}
              dangerouslySetInnerHTML={{ __html: product.short_description }}
            />
          ) : null}
          <Box pt={2}>
            {quantity > 0 ? (
              <CartQuantityRow
                quantity={quantity}
                disabled={isUpdatingCart}
                onDecrease={() => void onDecrease()}
                onIncrease={() => void onIncrease()}
                onRemove={() => void onRemove()}
                removeAriaLabel={t("removeFromCart")}
              />
            ) : (
              <HStack gap={3} flexWrap="wrap">
                <Button
                  size="md"
                  colorPalette="brand"
                  borderRadius="full"
                  onClick={() => void onAdd()}
                  disabled={!canAddToCart}
                >
                  {t("addToCart")}
                </Button>
                <Button size="md" variant="outline" onClick={() => openCart()}>
                  {tNav("viewCart")}
                </Button>
              </HStack>
            )}
          </Box>
        </Stack>
      </Grid>
    </Stack>
  );
}
