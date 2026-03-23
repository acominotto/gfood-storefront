"use client";

import { Box, Button, Flex, HStack, Image, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { signOut, useSession } from "next-auth/react";
import { NavCartPopover } from "@/components/nav-cart-popover";
import { Link } from "@/i18n/navigation";

export function TopNav() {
  const t = useTranslations();
  const { data: session } = useSession();
  const locale = useLocale();

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
      bg="white"
      position="sticky"
      top={0}
      zIndex={1000}
      shadow="sm"
      backdropFilter="saturate(180%) blur(2px)"
    >
      <HStack gap={3} align="center">
        <Image
          src="https://g-food.ch/wp-content/uploads/2025/03/logo-11.png"
          alt="G-Food logo"
          h="40px"
          w="auto"
          fallbackSrc="/product-placeholder.svg"
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
          <Link href="/commander-en-ligne">{t("nav.catalog")}</Link>
          <NavCartPopover />
          <Link href="/checkout">{t("nav.checkout")}</Link>
          <Link href="/login">{t("nav.login")}</Link>
        </HStack>
        <HStack gap={2}>
          <Link href="/commander-en-ligne" locale={locale === "fr" ? "en" : "fr"}>
            {locale === "fr" ? "EN" : "FR"}
          </Link>
          {session ? (
            <Button size="sm" variant="outline" onClick={() => signOut({ callbackUrl: `/${locale}/login` })}>
              {t("auth.logout")}
            </Button>
          ) : (
            <Box />
          )}
        </HStack>
      </Flex>
    </Flex>
  );
}
