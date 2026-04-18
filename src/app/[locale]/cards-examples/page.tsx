import { routing } from "@/i18n/routing";
import { ProductCard } from "@/features/catalog/components/product-card";
import { ProductPrice } from "@/features/catalog/components/product-price";
import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { fakeCases } from "./fixtures";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: "Product card examples",
    robots: { index: false, follow: false },
  };
}

export default async function CardsExamplesPage({ params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <Stack gap={10} py={6} px={{ base: 4, md: 8 }} align="stretch">
      <Stack gap={2}>
        <Heading size="2xl">Product card examples</Heading>
        <Text color="fg.muted">
          Fake products rendered with the real <code>ProductCard</code> and{" "}
          <code>ProductPrice</code> components to showcase each visual state.
        </Text>
      </Stack>

      <Stack gap={4}>
        <Heading size="lg">Cards grid</Heading>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} gap={6}>
          {fakeCases.map((c) => (
            <Stack key={c.product.id} gap={2} align="stretch">
              <Box>
                <Text fontSize="sm" fontWeight="semibold">
                  {c.label}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  {c.description}
                </Text>
              </Box>
              <Box>
                <ProductCard product={c.product} locale={locale} />
              </Box>
            </Stack>
          ))}
        </SimpleGrid>
      </Stack>

      <Stack gap={4}>
        <Heading size="lg">PDP price (size="lg")</Heading>
        <Text color="fg.muted" fontSize="sm">
          Same promotion logic at the bigger size used on the product detail page.
        </Text>
        <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} gap={6} alignItems="start">
          {fakeCases.map((c) => (
            <Stack
              key={`pdp-${c.product.id}`}
              gap={3}
              p={4}
              borderWidth="1px"
              borderColor="gray.200"
              rounded="lg"
              bg="white"
              align="flex-start"
            >
              <Text fontSize="sm" fontWeight="semibold">
                {c.label}
              </Text>
              <ProductPrice product={c.product} locale={locale} size="lg" />
            </Stack>
          ))}
        </SimpleGrid>
      </Stack>
    </Stack>
  );
}
