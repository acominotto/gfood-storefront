import { Box, Heading, SimpleGrid, Stack, Text } from "@chakra-ui/react";
import { cookies } from "next/headers";
import { TAXONOMY_PREVIEW_COOKIE } from "@/lib/taxonomy-preview-auth";
import { getAllProductCategories, getAllProductTags } from "@/server/woo-taxonomies";
import { TaxonomyPreviewGate, TaxonomyPreviewToolbar } from "./taxonomy-preview-client";

type TermRow = Awaited<ReturnType<typeof getAllProductCategories>>[number];

export async function generateMetadata() {
  return {
    title: "WooCommerce categories & tags",
    robots: { index: false, follow: false },
  };
}

export default async function TaxonomyPreviewPage() {
  const cookieStore = await cookies();
  const ok = cookieStore.get(TAXONOMY_PREVIEW_COOKIE)?.value === "1";

  if (!ok) {
    return <TaxonomyPreviewGate authPath="/api/taxonomy-preview/auth" />;
  }

  let categories: TermRow[] = [];
  let tags: TermRow[] = [];
  let loadError: string | null = null;

  try {
    [categories, tags] = await Promise.all([getAllProductCategories(), getAllProductTags()]);
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load taxonomies";
  }

  return (
    <Stack gap={6} align="stretch">
      <Stack direction="row" justify="space-between" align="flex-start" flexWrap="wrap" gap={3}>
        <Box>
          <Heading size="xl">WooCommerce taxonomies</Heading>
          <Text color="fg.muted" mt={1}>
            Product categories and tags from the Store API ({categories.length} categories, {tags.length} tags).
          </Text>
        </Box>
        <TaxonomyPreviewToolbar authPath="/api/taxonomy-preview/auth" />
      </Stack>

      {loadError ? (
        <Text color="red.600">{loadError}</Text>
      ) : null}

      <SimpleGrid columns={{ base: 1, md: 2 }} gap={8} alignItems="start">
        <Stack gap={2}>
          <Heading size="md">Categories</Heading>
          <Stack as="ul" gap={1} listStyleType="none" pl={0}>
            {categories.map((c) => (
              <Box as="li" key={c.id} fontSize="sm">
                <Text as="span" fontFamily="mono" fontWeight="medium" userSelect="all">
                  {c.id}
                </Text>
                <Text as="span" fontWeight="medium" ml={2}>
                  {c.name}
                </Text>
                <Text as="span" color="fg.muted" ml={2}>
                  ({c.slug}
                  {typeof c.count === "number" ? ` · ${c.count} products` : ""})
                </Text>
              </Box>
            ))}
          </Stack>
        </Stack>
        <Stack gap={2}>
          <Heading size="md">Tags</Heading>
          <Stack as="ul" gap={1} listStyleType="none" pl={0}>
            {tags.map((t) => (
              <Box as="li" key={t.id} fontSize="sm">
                <Text as="span" fontFamily="mono" fontWeight="medium" userSelect="all">
                  {t.id}
                </Text>
                <Text as="span" fontWeight="medium" ml={2}>
                  {t.name}
                </Text>
                <Text as="span" color="fg.muted" ml={2}>
                  ({t.slug}
                  {typeof t.count === "number" ? ` · ${t.count} products` : ""})
                </Text>
              </Box>
            ))}
          </Stack>
        </Stack>
      </SimpleGrid>
    </Stack>
  );
}
