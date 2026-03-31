"use client";

import { Badge, Box, Heading, HStack, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { LuConstruction } from "react-icons/lu";

const STRIPE_BG = `repeating-linear-gradient(
  -42deg,
  #fff7ed 0px,
  #fff7ed 14px,
  #ffedd5 14px,
  #ffedd5 28px
)`;

/** Reserved catalog band for future promotions; “work in progress” styling. */
export function CatalogPromoPlaceholder() {
  const t = useTranslations("catalog");

  return (
    <Box
      position="relative"
      rounded="2xl"
      overflow="hidden"
      borderWidth="2px"
      borderStyle="dashed"
      borderColor="orange.300"
      minH={{ base: "7rem", md: "8.5rem" }}
      role="region"
      aria-label={t("promoTitle")}
    >
      <Box position="absolute" inset={0} bgImage={STRIPE_BG} opacity={0.85} aria-hidden />
      <Box
        position="absolute"
        inset={0}
        bg="linear-gradient(to bottom, rgba(255,255,255,0.92) 0%, rgba(255,250,240,0.88) 100%)"
        aria-hidden
      />

      <Stack
        position="relative"
        zIndex={1}
        gap={3}
        px={{ base: 4, md: 7 }}
        py={{ base: 5, md: 7 }}
        align="flex-start"
      >
        <HStack gap={2} flexWrap="wrap">
          <Badge
            colorPalette="orange"
            variant="solid"
            px={3}
            py={1}
            fontSize="xs"
            textTransform="uppercase"
            letterSpacing="widest"
            rounded="md"
          >
            {t("promoBadge")}
          </Badge>
        </HStack>

        <HStack gap={3} align="flex-start">
          <Box color="orange.600" flexShrink={0} mt={0.5}>
            <LuConstruction size={28} strokeWidth={1.75} aria-hidden />
          </Box>
          <Stack gap={1} minW={0}>
            <Heading size="lg" color="gray.800">
              {t("promoTitle")}
            </Heading>
            <Text fontSize={{ base: "sm", md: "md" }} color="gray.600">
              {t("promoDescription")}
            </Text>
          </Stack>
        </HStack>
      </Stack>
    </Box>
  );
}
