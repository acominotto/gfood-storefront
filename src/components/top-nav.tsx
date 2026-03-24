"use client";

import { NavAccountMenu } from "@/components/nav-account-menu";
import { NavCartButton } from "@/components/nav-cart-button";
import { NavDeliveryDialog } from "@/components/nav-delivery-dialog";

import { Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { Link } from "./ui/link";

export function TopNav() {
  const t = useTranslations();

  return (
    <Flex
      as="header"

      justify="space-between"
      align={{ base: "flex-start", md: "center" }}
      direction={{ base: "column", md: "row" }}
      gap={{ base: 4, md: 3 }}
      py={{ base: 4, md: 5 }}
      px={{ base: 4, md: 8, lg: 10 }}
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg="brand.50"
      position="sticky"
      top={0}
      zIndex={1000}
      shadow="sm"
      backdropFilter="saturate(180%) blur(2px)"
    >
      <HStack gap={3} align="center">
        <Image
          src="/gashi-logo.png"
          alt="G-Food.ch"
          h="40px"
          w="auto"
          maxW="min(100%, 200px)"
        />
        <Stack gap={0}>
          <Text fontWeight="bold" color="gray.800" lineHeight="short">
            GASHI International Food
          </Text>
          <Text fontSize="sm" color="gray.500" lineHeight="shorter">
            Les saveurs d&apos;ailleurs
          </Text>
        </Stack>
      </HStack>
      <Flex
        direction={{ base: "column", sm: "row" }}
        w={{ base: "full", md: "auto" }}
        justify={{ base: "space-between", md: "flex-end" }}
        align={{ base: "flex-start", sm: "center" }}
        gap={{ base: 3, sm: 5 }}
      >
        <HStack gap={{ base: 3, md: 4 }} wrap="wrap">
          <Link variant="underline" href="/commander-en-ligne">
            {t("nav.catalog")}
          </Link>
          <NavDeliveryDialog />
          <Link variant="underline" href="/impressum">
            {t("footer.impressum")}
          </Link>
          <NavCartButton />
          <NavAccountMenu />
        </HStack>
      </Flex>
    </Flex>
  );
}
