"use client";

import {
  Badge,
  Box,
  Flex,
  HStack,
  IconButton,
  Popover,
  Portal,
  Spinner,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { FiShoppingCart } from "react-icons/fi";
import { Link } from "@/i18n/navigation";
import { apiClient } from "@/lib/api-client";
import { cartResponseSchema } from "@/server/schemas/cart";

function formatMoney(amount: string | null | undefined, currency: string | null | undefined, locale: string) {
  if (!amount) {
    return "-";
  }
  const value = Number(amount) / 100;
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency?.toUpperCase() || "CHF",
  }).format(value);
}

function getItemsCount(itemsCount: number | undefined, quantities: number[]) {
  if (typeof itemsCount === "number") {
    return itemsCount;
  }
  return quantities.reduce((total, qty) => total + qty, 0);
}

export function NavCartPopover() {
  const t = useTranslations("nav");
  const locale = useLocale();

  const cartQuery = useQuery({
    queryKey: ["cart"],
    queryFn: async () => cartResponseSchema.parse(await (await apiClient.get("woo/cart")).json()),
  });

  const cartItems = cartQuery.data?.items ?? [];
  const itemsCount = getItemsCount(
    cartQuery.data?.items_count,
    cartItems.map((item) => item.quantity),
  );
  const previewItems = cartItems.slice(0, 4);
  const hiddenItemsCount = Math.max(cartItems.length - previewItems.length, 0);
  const totalText = formatMoney(cartQuery.data?.totals?.total_price, cartQuery.data?.totals?.currency_code, locale);

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <Box position="relative">
          <IconButton size="sm" variant="outline" aria-label={t("cart")}>
            <FiShoppingCart />
          </IconButton>
          <Badge
            position="absolute"
            top="-1.5"
            right="-1.5"
            colorPalette="gray"
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
        </Box>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content maxW="360px">
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
            <Popover.Body p={4}>
              <Stack gap={3}>
                <HStack justify="space-between">
                  <Text fontWeight="semibold">{t("cart")}</Text>
                  <Text fontSize="sm" color="gray.600">
                    {itemsCount} {t("items")}
                  </Text>
                </HStack>

                {cartQuery.isPending ? (
                  <Flex gap={2} align="center">
                    <Spinner size="sm" />
                    <Text fontSize="sm">{t("cartLoading")}</Text>
                  </Flex>
                ) : null}

                {cartQuery.isError ? (
                  <Text fontSize="sm" color="gray.700">
                    {t("cartError")}
                  </Text>
                ) : null}

                {!cartQuery.isPending && !cartQuery.isError ? (
                  <>
                    {previewItems.length > 0 ? (
                      <Stack gap={2}>
                        {previewItems.map((item) => (
                          <HStack key={item.key} justify="space-between" align="flex-start">
                            <Text fontSize="sm" lineClamp={2} maxW="240px">
                              {item.name}
                            </Text>
                            <Text fontSize="sm" color="gray.600">
                              x{item.quantity}
                            </Text>
                          </HStack>
                        ))}
                        {hiddenItemsCount > 0 ? (
                          <Text fontSize="xs" color="gray.500">
                            {t("andMore", { count: hiddenItemsCount })}
                          </Text>
                        ) : null}
                      </Stack>
                    ) : (
                      <Box borderWidth="1px" borderColor="gray.200" rounded="md" p={3}>
                        <Text fontSize="sm" color="gray.600">
                          {t("cartEmpty")}
                        </Text>
                      </Box>
                    )}

                    <HStack justify="space-between" borderTopWidth="1px" borderColor="gray.200" pt={3}>
                      <Text fontWeight="semibold">{t("total")}</Text>
                      <Text fontWeight="bold">{totalText}</Text>
                    </HStack>
                  </>
                ) : null}

                <HStack justify="space-between" pt={1}>
                  <Link href="/cart">{t("viewCart")}</Link>
                  <Link href="/checkout">{t("goToCheckout")}</Link>
                </HStack>
              </Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
