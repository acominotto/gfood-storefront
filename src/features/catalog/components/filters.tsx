"use client";

import { Button } from "@/components/ui/button";
import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useProductsStore } from "@/features/catalog/store/products-store";
import { buildAncestorChain, buildCategoryFilterComboboxData, childrenOf } from "@/lib/category-tree";
import { Box, Flex, HStack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { forwardRef, useEffect, useMemo } from "react";

export const CatalogFilterBar = forwardRef<HTMLDivElement>(function CatalogFilterBar(_, ref) {
  const t = useTranslations("catalog");
  const category = useCatalogFilterStore((s) => s.category);
  const setCategory = useCatalogFilterStore((s) => s.setCategory);
  const facets = useProductsStore((s) => s.facets);
  const fetchFacets = useProductsStore((s) => s.fetchFacets);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    void fetchFacets();
  }, [fetchFacets]);

  const { groups, allLabel, roots } = useMemo(() => {
    const categories = facets?.categories ?? [];
    const built = buildCategoryFilterComboboxData(categories, t("allCategories"));
    return {
      groups: built.groups,
      allLabel: built.allOption.label,
      roots: childrenOf(0, categories),
    };
  }, [facets?.categories, t]);

  const activeRootId = useMemo(() => {
    const categoriesList = facets?.categories ?? [];
    if (!category || categoriesList.length === 0) {
      return null;
    }
    const id = Number(category);
    if (Number.isNaN(id)) {
      return null;
    }
    const chain = buildAncestorChain(id, categoriesList);
    return chain[0]?.id ?? null;
  }, [category, facets]);

  const activeGroup = useMemo(() => {
    if (activeRootId == null) {
      return null;
    }
    const idx = roots.findIndex((r) => r.id === activeRootId);
    if (idx < 0) {
      return null;
    }
    return groups[idx] ?? null;
  }, [activeRootId, groups, roots]);

  function navigateWithCategory(nextCategory: string) {
    setCategory(nextCategory);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    if (nextCategory) {
      p.set("category", nextCategory);
    } else {
      p.delete("category");
    }
    const qs = p.toString();
    router.replace(qs ? `?${qs}` : "?");
  }

  return (
    <Box
      ref={ref}
      borderBottomWidth="1px"
      borderColor="gray.200"
      bg="white"
      shadow="sm"
      py={3}
      minW={0}
    >
      <Flex direction="column" gap={2} minW={0}>
        <HStack
          gap={2}
          overflowX="auto"
          flexWrap="nowrap"
          py={1}
          pb={3}
          px={{ base: 3, md: 6 }}
          css={{
            scrollbarWidth: "thin",
            WebkitOverflowScrolling: "touch",
          }}
        >
          <Button
            flexShrink={0}
            size="sm"
            variant={category === "" ? "solid" : "outline"}
            colorPalette={category === "" ? "brand" : "gray"}
            rounded="full"
            onClick={() => navigateWithCategory("")}
          >
            {allLabel}
          </Button>
          {roots.map((root) => {
            const isActive = activeRootId === root.id;
            return (
              <Button
                key={root.id}
                flexShrink={0}
                size="sm"
                variant={isActive ? "solid" : "outline"}
                colorPalette={isActive ? "brand" : "gray"}
                rounded="full"
                onClick={() => navigateWithCategory(String(root.id))}
              >
                {root.name}
              </Button>
            );
          })}
        </HStack>

        {category !== "" && activeGroup ? (
          <HStack
            gap={2}
            overflowX="auto"
            flexWrap="nowrap"
            py={1}
            pb={2}
            px={{ base: 3, md: 6 }}
            borderLeftWidth="3px"
            borderColor="brand.200"
            css={{
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {activeGroup.items.map((item) => {
              const isSel = category === item.value;
              return (
                <Button
                  key={item.value}
                  flexShrink={0}
                  size="xs"
                  variant={isSel ? "solid" : "ghost"}
                  colorPalette={isSel ? "brand" : "gray"}
                  rounded="full"
                  onClick={() => navigateWithCategory(item.value)}
                >
                  {item.label.trim()}
                </Button>
              );
            })}
          </HStack>
        ) : null}
      </Flex>
    </Box>
  );
});

/** @deprecated Use `CatalogFilterBar` */
export const CatalogFilters = CatalogFilterBar;
