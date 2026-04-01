"use client";

import { NavAccountMenu } from "@/components/nav-account-menu";
import { NavCartButton } from "@/components/nav-cart-button";
import { NavDeliveryDialog } from "@/components/nav-delivery-dialog";
import { useNavbarStore } from "@/stores/navbar-store";
import { usePathname } from "@/i18n/navigation";

import { Flex, HStack, Image, Input, InputGroup, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { LuSearch } from "react-icons/lu";
import { Link } from "./ui/link";

function CatalogSearchField({
  catalogSearch,
  onChange,
  placeholder,
  width,
}: {
  catalogSearch: string;
  onChange: (value: string) => void;
  placeholder: string;
  width?: string;
}) {
  return (
    <InputGroup
      w={width ?? "full"}
      borderRadius="full"
      startElement={<LuSearch aria-hidden size={18} />}
      startElementProps={{ pointerEvents: "none" }}
    >
      <Input
        size="sm"
        placeholder={placeholder}
        value={catalogSearch}
        onChange={(e) => onChange(e.target.value)}
        bg="white"
        borderColor="gray.200"
        borderRadius="full"
        textAlign="right"
        aria-label={placeholder}
      />
    </InputGroup>
  );
}

export function TopNav() {
  const t = useTranslations();
  const tCatalog = useTranslations("catalog");
  const pathname = usePathname();
  const isCatalogHome = pathname === "/";
  const catalogSearch = useNavbarStore((s) => s.catalogSearch);
  const setCatalogSearch = useNavbarStore((s) => s.setCatalogSearch);

  return (
    <Stack
      as="header"
      data-storefront-top-nav=""
      gap={{ base: 3, md: 3 }}
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
      w="full"
    >
      <Flex justify="space-between" align="center" direction="row" gap={{ base: 3, md: 3 }} w="full" minW={0}>
        <HStack gap={3} align="center" asChild>
          <Link href="/" display="flex" alignItems="center" gap={3} _hover={{ textDecoration: "none" }} minW={0}>
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
          </Link>
        </HStack>

        {isCatalogHome ? (
          <Flex
            display={{ base: "none", md: "flex" }}
            flex="1"
            justify="center"
            maxW="28rem"
            minW={0}
            px={2}
          >
            <CatalogSearchField
              catalogSearch={catalogSearch}
              onChange={setCatalogSearch}
              placeholder={tCatalog("searchPlaceholder")}
            />
          </Flex>
        ) : null}

        <Flex
          display={{ base: "none", md: "flex" }}
          direction="row"
          w="auto"
          justify="flex-end"
          align="center"
          gap={5}
          flexShrink={0}
        >
          <HStack gap={{ base: 3, md: 4 }} wrap="wrap">
            <NavDeliveryDialog />
            <Link variant="underline" href="/impressum">
              {t("footer.impressum")}
            </Link>
            <NavCartButton />
            <NavAccountMenu />
          </HStack>
        </Flex>
      </Flex>

      {isCatalogHome ? (
        <Flex display={{ base: "flex", md: "none" }} w="full" minW={0}>
          <CatalogSearchField
            catalogSearch={catalogSearch}
            onChange={setCatalogSearch}
            placeholder={tCatalog("searchPlaceholder")}
            width="full"
          />
        </Flex>
      ) : null}
    </Stack>
  );
}
