"use client";

import { useCartStore } from "@/features/cart/store/cart-store";
import { computeFreeShippingProgress } from "@/features/cart/lib/free-shipping";
import { formatCartMoney } from "@/lib/cart-format";
import { Box, HStack, Icon, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import type { ReactNode } from "react";
import { FiCheckCircle, FiTruck } from "react-icons/fi";

export function FreeShippingProgress() {
  const t = useTranslations("delivery");
  const locale = useLocale();
  const cart = useCartStore((s) => s.cart);
  const progress = computeFreeShippingProgress(cart);

  if (!progress) {
    return null;
  }

  if (progress.unlocked) {
    return (
      <Box
        borderWidth="1px"
        borderColor="green.200"
        bg="green.50"
        rounded="md"
        px={3}
        py={2}
      >
        <HStack gap={2} color="green.700">
          <Icon as={FiCheckCircle} boxSize={5} />
          <Text fontWeight="semibold" fontSize="sm">
            {t("freeShippingUnlocked")}
          </Text>
        </HStack>
      </Box>
    );
  }

  const remainingText = formatCartMoney(
    String(progress.remainingMinor),
    progress.currency,
    locale,
  );

  return (
    <Box
      borderWidth="1px"
      borderColor="gray.200"
      bg="gray.50"
      rounded="md"
      px={3}
      py={2}
    >
      <HStack gap={2} color="gray.700" align="flex-start">
        <Icon as={FiTruck} boxSize={4} mt="2px" />
        <Text fontSize="sm">
          {t.rich("freeShippingMissing", {
            amount: remainingText,
            strong: (chunks: ReactNode) => (
              <Text as="span" fontWeight="semibold" color="gray.900">
                {chunks}
              </Text>
            ),
          })}
        </Text>
      </HStack>
    </Box>
  );
}
