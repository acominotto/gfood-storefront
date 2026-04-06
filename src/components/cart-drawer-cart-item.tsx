"use client";

import { CartQuantityRow } from "@/components/cart-quantity-row";
import { useCartStore } from "@/features/cart/store/cart-store";
import { ProductImagePlaceholder } from "@/features/catalog/components/product-image-placeholder";
import { Link } from "@/components/ui/link";
import {
  cartItemImageProxy,
  cartItemLineTotalMinor,
  cartItemUnitPriceMinor,
  decodeHtmlEntities,
  formatCartMoney,
  type CartLineItem,
} from "@/lib/cart-format";
import { productHrefFromCartLineItem } from "@/lib/product-url";
import { Box, Grid, GridItem, Image, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";

type CartDrawerCartItemProps = {
  item: CartLineItem;
  cartCurrency: string | null | undefined;
  isLast: boolean;
};

export function CartDrawerCartItem({ item, cartCurrency, isLast }: CartDrawerCartItemProps) {
  const tCatalog = useTranslations("catalog");
  const locale = useLocale();
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const busy = useCartStore((s) => s.mutatingProductId !== null);

  const currency = item.prices?.currency_code ?? cartCurrency;
  const proxySrc = cartItemImageProxy(item);
  const lineTotalMinor = cartItemLineTotalMinor(item);
  const lineTotalText = formatCartMoney(lineTotalMinor, currency, locale);
  const unitMinor = cartItemUnitPriceMinor(item);
  const unitPriceText = unitMinor != null ? formatCartMoney(unitMinor, currency, locale) : null;
  const displayName = decodeHtmlEntities(item.name);
  const productHref = productHrefFromCartLineItem(item);
  const thumb = (
    <Box
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
        <Image src={proxySrc} alt={displayName} w="full" h="full" objectFit="contain" />
      ) : (
        <Box w="full" h="full" display="flex" alignItems="center" justifyContent="center" p={1}>
          <ProductImagePlaceholder />
        </Box>
      )}
    </Box>
  );
  return (
    <Grid
      templateColumns="72px minmax(0, 1fr) auto"
      templateRows="auto auto"
      columnGap={3}
      rowGap={2}
      alignItems="start"
      pb={4}
      borderBottomWidth={isLast ? undefined : "1px"}
      borderColor="gray.100"
    >
      <GridItem rowSpan={2} colStart={1}>
        {productHref ? (
          <Link href={productHref} display="block" _hover={{ textDecoration: "none" }}>
            {thumb}
          </Link>
        ) : (
          thumb
        )}
      </GridItem>
      <GridItem colStart={2} rowStart={1} minW={0}>
        {productHref ? (
          <Link
            href={productHref}
            variant="plain"
            fontSize="sm"
            fontWeight="semibold"
            lineClamp={2}
            _hover={{ textDecoration: "underline" }}
          >
            {displayName}
          </Link>
        ) : (
          <Text fontSize="sm" fontWeight="semibold" lineClamp={2}>
            {displayName}
          </Text>
        )}
      </GridItem>
      {lineTotalText !== "-" ? (
        <GridItem colStart={3} rowStart={1} justifySelf="end" minW={0}>
          <Text fontSize="sm" fontWeight="bold" whiteSpace="nowrap" textAlign="end">
            {lineTotalText}
          </Text>
        </GridItem>
      ) : null}
      <GridItem colStart={2} rowStart={2} minW={0} w="full">
        <CartQuantityRow
          compact
          quantity={item.quantity}
          disabled={busy}
          onDecrease={() => {
            if (item.quantity <= 1) {
              return removeItem(item.key, item.id);
            }
            return updateItemQuantity(item.key, item.quantity - 1, item.id);
          }}
          onIncrease={() => updateItemQuantity(item.key, item.quantity + 1, item.id)}
          onRemove={() => removeItem(item.key, item.id)}
          removeAriaLabel={tCatalog("removeFromCart")}
        />
      </GridItem>
    </Grid >
  );
}
