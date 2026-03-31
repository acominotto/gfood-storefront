import { Box, Heading, Stack, Text } from "@chakra-ui/react";
import { notFound } from "next/navigation";
import { env } from "@/lib/env";
import {
  fetchProductsRawWithTotals,
  fetchStoreApiAllPages,
  priceRangeFromRawProducts,
  tryFetchStoreApiAllPages,
} from "@/server/woo-store-raw";
import { getWooBaseUrl } from "@/server/woo-client";

function JsonBlock({ title, data }: { title: string; data: unknown }) {
  return (
    <Stack gap={2} align="stretch">
      <Heading size="md">{title}</Heading>
      <Box
        as="pre"
        overflow="auto"
        maxH="70vh"
        fontSize="xs"
        fontFamily="mono"
        p={3}
        borderWidth="1px"
        borderRadius="md"
        bg="gray.50"
      >
        {JSON.stringify(data, null, 2)}
      </Box>
    </Stack>
  );
}

export async function generateMetadata() {
  return {
    title: "WooCommerce (dev)",
    robots: { index: false, follow: false },
  };
}

export default async function WooDevPage() {
  if (env.NODE_ENV !== "development") {
    notFound();
  }

  let loadError: string | null = null;
  let categories: unknown[] = [];
  let tags: unknown[] = [];
  let productsPayload: Awaited<ReturnType<typeof fetchProductsRawWithTotals>> | null = null;
  let attributes: unknown[] | null = null;
  let brands: unknown[] | null = null;

  try {
    const [cats, tgs, prods] = await Promise.all([
      fetchStoreApiAllPages("products/categories"),
      fetchStoreApiAllPages("products/tags"),
      fetchProductsRawWithTotals(),
    ]);
    categories = cats;
    tags = tgs;
    productsPayload = prods;
  } catch (e) {
    loadError = e instanceof Error ? e.message : "Failed to load WooCommerce data";
  }

  if (!loadError && productsPayload) {
    [attributes, brands] = await Promise.all([
      tryFetchStoreApiAllPages("products/attributes"),
      tryFetchStoreApiAllPages("products/brands"),
    ]);
  }

  const products = productsPayload?.items ?? [];
  const priceRange = priceRangeFromRawProducts(products);

  return (
    <Stack gap={8} align="stretch">
      <Stack gap={1}>
        <Heading size="xl">WooCommerce (development only)</Heading>
        <Text color="fg.muted">
          Store API snapshot: stats, taxonomies, optional attribute/brand endpoints, and full product payloads
          as returned by the API (not storefront Zod schemas).
        </Text>
      </Stack>

      {loadError ? <Text color="red.600">{loadError}</Text> : null}

      {!loadError && productsPayload ? (
        <>
          <Stack gap={2}>
            <Heading size="md">Stats</Heading>
            <Box
              as="pre"
              fontSize="sm"
              fontFamily="mono"
              p={3}
              borderWidth="1px"
              borderRadius="md"
              bg="gray.50"
            >
              {JSON.stringify(
                {
                  storeApiBaseUrl: getWooBaseUrl(),
                  products: {
                    reportTotal: productsPayload.total,
                    reportTotalPages: productsPayload.totalPages,
                    loadedCount: products.length,
                  },
                  categoriesCount: categories.length,
                  tagsCount: tags.length,
                  attributesCount: attributes?.length ?? null,
                  brandsCount: brands?.length ?? null,
                  priceRangeMinorUnits: priceRange,
                },
                null,
                2,
              )}
            </Box>
          </Stack>

          <JsonBlock title="products/categories (raw)" data={categories} />
          <JsonBlock title="products/tags (raw)" data={tags} />
          {attributes === null ? (
            <Stack gap={2}>
              <Heading size="md">products/attributes (raw)</Heading>
              <Text color="fg.muted" fontSize="sm">
                Endpoint unavailable or failed (not all shops expose this on the Store API).
              </Text>
            </Stack>
          ) : (
            <JsonBlock title="products/attributes (raw)" data={attributes} />
          )}
          {brands === null ? (
            <Stack gap={2}>
              <Heading size="md">products/brands (raw)</Heading>
              <Text color="fg.muted" fontSize="sm">
                Endpoint unavailable or failed (requires Woo brands or compatible extension).
              </Text>
            </Stack>
          ) : (
            <JsonBlock title="products/brands (raw)" data={brands} />
          )}

          <JsonBlock title="products (raw array, all pages)" data={products} />
        </>
      ) : null}
    </Stack>
  );
}
