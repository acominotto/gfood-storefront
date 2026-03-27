"use client";

import { Link } from "@/components/ui/link";
import { buildAncestorChain, childrenOf, pickPrimaryCategoryId } from "@/lib/category-tree";
import type { Category, Product } from "@/server/schemas/catalog";
import { Box, HStack, Portal, Select, Text, createListCollection } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

type ProductCategoryBreadcrumbProps = {
  product: Product;
  categories: Category[];
  locale: string;
};

export function ProductCategoryBreadcrumb({ product, categories, locale }: ProductCategoryBreadcrumbProps) {
  const t = useTranslations("catalog");
  const router = useRouter();

  const chain = useMemo(() => {
    const id = pickPrimaryCategoryId(product.categories, categories);
    if (id === null) {
      return [];
    }
    return buildAncestorChain(id, categories);
  }, [product.categories, categories]);

  return (
    <HStack gap={2} flexWrap="wrap" alignItems="center" minW={0} rowGap={3}>
      <Link href="/" variant="underline" fontSize="sm" color="gray.600">
        {t("breadcrumbHome")}
      </Link>

      {chain.map((cat, k) => {
        const parentId = k === 0 ? 0 : chain[k - 1].id;
        let opts = childrenOf(parentId, categories);
        if (!opts.some((c) => c.id === cat.id)) {
          opts = [...opts, cat].sort((a, b) => a.name.localeCompare(b.name));
        }
        const collection = createListCollection({
          items: opts.map((c) => ({ label: c.name, value: String(c.id) })),
        });
        return (
          <HStack key={cat.id} gap={2} alignItems="center" flexWrap="nowrap">
            <Text color="gray.400" fontSize="sm" userSelect="none" aria-hidden>
              /
            </Text>
            <Box minW={{ base: "min(100%, 200px)", sm: "220px" }} maxW="min(100%, 320px)">
              <Select.Root
                collection={collection}
                size="sm"
                width="full"
                value={[String(cat.id)]}
                onValueChange={(e) => {
                  const v = e.value[0];
                  if (v) {
                    router.push(`/${locale}?category=${encodeURIComponent(v)}`);
                  }
                }}
              >
                <Select.HiddenSelect />
                <Select.Control>
                  <Select.Trigger bg="gray.50">
                    <Select.ValueText placeholder={cat.name} />
                  </Select.Trigger>
                  <Select.IndicatorGroup>
                    <Select.Indicator />
                  </Select.IndicatorGroup>
                </Select.Control>
                <Portal>
                  <Select.Positioner>
                    <Select.Content>
                      {collection.items.map((item) => (
                        <Select.Item item={item} key={item.value}>
                          {item.label}
                          <Select.ItemIndicator />
                        </Select.Item>
                      ))}
                    </Select.Content>
                  </Select.Positioner>
                </Portal>
              </Select.Root>
            </Box>
          </HStack>
        );
      })}

      <Text color="gray.400" fontSize="sm" userSelect="none" aria-hidden>
        /
      </Text>
      <Text fontWeight="semibold" fontSize="sm" color="gray.800" lineClamp={2} flex="1" minW={0}>
        {product.name}
      </Text>
    </HStack>
  );
}
