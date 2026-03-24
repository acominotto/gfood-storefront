"use client";

import { formatCartMoney, type CartFeeLine } from "@/lib/cart-format";
import { HStack, Text } from "@chakra-ui/react";
import { useLocale } from "next-intl";

type CartDrawerFeeLineProps = {
  fee: CartFeeLine;
  cartCurrency: string | null | undefined;
  isLast: boolean;
};

export function CartDrawerFeeLine({ fee, cartCurrency, isLast }: CartDrawerFeeLineProps) {
  const locale = useLocale();
  const currency = fee.totals?.currency_code ?? cartCurrency;
  const lineText = formatCartMoney(fee.totals?.total ?? null, currency, locale);

  return (
    <HStack
      align="flex-start"
      justify="space-between"
      gap={3}
      pb={4}
      borderBottomWidth={isLast ? undefined : "1px"}
      borderColor="gray.100"
    >
      <Text fontSize="sm" fontWeight="medium" color="gray.700" lineClamp={3}>
        {fee.name}
      </Text>
      <Text fontSize="sm" fontWeight="semibold" flexShrink={0} whiteSpace="nowrap">
        {lineText}
      </Text>
    </HStack>
  );
}
