"use client";

import { CartDeliveryLine } from "@/components/cart-delivery-line";
import { CartQuantityRow } from "@/components/cart-quantity-row";
import { Link } from "@/components/ui/link";
import { FreeShippingProgress } from "@/features/cart/components/free-shipping-progress";
import { useCartStore } from "@/features/cart/store/cart-store";
import { productHrefFromCartLineItem } from "@/lib/product-url";
import { formatCartMoney, type CartFeeLine } from "@/lib/cart-format";
import { Box, Card, HStack, Spinner, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect } from "react";

function CartFeeRow({ fee, cartCurrency }: { fee: CartFeeLine; cartCurrency: string | null | undefined }) {
  const locale = useLocale();
  const currency = fee.totals?.currency_code ?? cartCurrency;
  const lineText = formatCartMoney(fee.totals?.total ?? null, currency, locale);
  return (
    <Box borderWidth="1px" rounded="md" p={3} bg="gray.50">
      <HStack justify="space-between" align="flex-start" gap={3}>
        <Text fontWeight="medium" color="gray.700">
          {fee.name}
        </Text>
        <Text fontWeight="semibold">{lineText}</Text>
      </HStack>
    </Box>
  );
}

export default function CartPage() {
  const tCatalog = useTranslations("catalog");
  const tNav = useTranslations("nav");
  const locale = useLocale();
  const cart = useCartStore((s) => s.cart);
  const status = useCartStore((s) => s.status);
  const ensureCartLoaded = useCartStore((s) => s.ensureCartLoaded);
  const updateItemQuantity = useCartStore((s) => s.updateItemQuantity);
  const removeItem = useCartStore((s) => s.removeItem);
  const mutatingProductId = useCartStore((s) => s.mutatingProductId);

  useEffect(() => {
    void ensureCartLoaded();
  }, [ensureCartLoaded]);

  const pending = status === "loading" && !cart;
  const busy = mutatingProductId !== null;

  if (pending) {
    return <Spinner />;
  }

  return (
    <Card.Root>
      <Card.Header>
        <Text fontSize="2xl" fontWeight="bold">
          Cart
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap={4}>
          {(cart?.items?.length ?? 0) > 0 ? <FreeShippingProgress /> : null}
          {cart?.items?.map((item) => {
            const href = productHrefFromCartLineItem(item);
            return (
            <Box key={item.key} borderWidth="1px" rounded="md" p={3}>
              {href ? (
                <Link href={href} variant="plain" fontWeight="semibold" _hover={{ textDecoration: "underline" }}>
                  {item.name}
                </Link>
              ) : (
                <Text fontWeight="semibold">{item.name}</Text>
              )}
              <Box mt={2}>
                <CartQuantityRow
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
              </Box>
            </Box>
            );
          })}
          {cart?.fees?.map((fee) => (
            <CartFeeRow key={fee.key} fee={fee} cartCurrency={cart?.totals?.currency_code} />
          ))}
          {(cart?.items?.length ?? 0) > 0 ? (
            <Stack gap={3} pt={2} borderTopWidth="1px" borderColor="gray.200">
              <CartDeliveryLine
                label={tNav("delivery")}
                amountMinor={cart?.totals?.total_shipping}
                currency={cart?.totals?.currency_code}
              />
              <HStack justify="space-between">
                <Text fontWeight="semibold">{tNav("total")}</Text>
                <Text fontWeight="bold">
                  {formatCartMoney(cart?.totals?.total_price, cart?.totals?.currency_code, locale)}
                </Text>
              </HStack>
            </Stack>
          ) : null}
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
