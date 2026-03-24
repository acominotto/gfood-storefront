"use client";


import { Box, Container, Flex, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { Link } from "./ui/link";

export function AppFooter() {
  const t = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <Box as="footer" borderTopWidth="1px" bg="brand.50" flexShrink={0}>
      <Container maxW="min(100%, 120rem)" py={6} px={{ base: 4, md: 8 }}>
        <Flex
          direction={{ base: "column", sm: "row" }}
          justify="space-between"
          align={{ base: "flex-start", sm: "center" }}
          gap={3}
        >
          <Text fontSize="sm" color="gray.600">
            © {year} G-Food
          </Text>
          <Link variant="underline" href="/impressum">

            {t("impressum")}

          </Link>
        </Flex>
      </Container>
    </Box>
  );
}
