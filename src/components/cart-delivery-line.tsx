"use client";

import { formatCartMoney } from "@/lib/cart-format";
import { Box, HStack, Text } from "@chakra-ui/react";
import { useLocale } from "next-intl";

type CartDeliveryLineProps = {
  label: string;
  amountMinor: string | null | undefined;
  currency: string | null | undefined;
  variant?: "summary" | "checkout";
};

export function CartDeliveryLine({
  label,
  amountMinor,
  currency,
  variant = "summary",
}: CartDeliveryLineProps) {
  const locale = useLocale();
  const lineText = formatCartMoney(amountMinor, currency, locale);

  if (variant === "checkout") {
    return (
      <Box py={2} borderBottomWidth="1px" borderColor="gray.100">
        <HStack justify="space-between" gap={3}>
          <Text fontSize="sm" color="fg.muted">
            {label}
          </Text>
          <Text fontSize="sm" fontWeight="medium">
            {lineText}
          </Text>
        </HStack>
      </Box>
    );
  }

  return (
    <HStack justify="space-between" w="full">
      <Text fontWeight="medium" color="gray.600">
        {label}
      </Text>
      <Text fontWeight="semibold">{lineText}</Text>
    </HStack>
  );
}
