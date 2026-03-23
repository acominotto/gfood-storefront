"use client";

import { Box, Container, Flex, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

export function AppFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <Box as="footer" borderTopWidth="1px" borderColor="gray.200" bg="white" flexShrink={0}>
      <Container maxW="7xl" py={6} px={{ base: 4, md: 8 }}>
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "flex-start", sm: "center" }}
          gap={3}
        >
          <Text fontSize="sm" color="gray.600">
            © {year} G-Food
          </Text>
          <Link href="/impressum">
            <Text as="span" fontSize="sm" color="gray.700" textDecoration="underline">
              {t("impressum")}
            </Text>
          </Link>
        </Flex>
      </Container>
    </Box>
  );
}
