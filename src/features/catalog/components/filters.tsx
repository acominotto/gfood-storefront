"use client";

import { Button } from "@/components/ui/button";
import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useProductsStore } from "@/features/catalog/store/products-store";
import { buildAncestorChain, buildCategoryFilterComboboxData, childrenOf } from "@/lib/category-tree";
import { Box, Checkbox, Flex, HStack, Popover, Portal, Spinner, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { forwardRef, useEffect, useMemo } from "react";

type AttributeFacetMessages = {
  label: string;
  aria: string;
  hint: string;
  loading: string;
  empty: string;
  clear: string;
};

type AttributeFacetFilterProps = {
  paramName: string;
  terms: { slug: string; name: string }[];
  selectedSlugs: string[];
  setSelectedSlugs: (next: string[]) => void;
  messages: AttributeFacetMessages;
  facetsStatus: "idle" | "loading" | "error";
};

function AttributeFacetFilter({
  paramName,
  terms,
  selectedSlugs,
  setSelectedSlugs,
  messages,
  facetsStatus,
}: AttributeFacetFilterProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const loading = facetsStatus === "loading";
  const selectedCount = selectedSlugs.length;

  function navigateWithSelection(next: string[]) {
    setSelectedSlugs(next);
    const p = new URLSearchParams(searchParams.toString());
    p.delete("page");
    p.delete(paramName);
    for (const slug of next) {
      p.append(paramName, slug);
    }
    const qs = p.toString();
    router.replace(qs ? `?${qs}` : "?");
  }

  return (
    <Popover.Root positioning={{ placement: "bottom-start" }}>
      <Popover.Trigger asChild>
        <Button
          flexShrink={0}
          size="sm"
          variant={selectedCount > 0 ? "solid" : "outline"}
          colorPalette={selectedCount > 0 ? "brand" : "gray"}
          rounded="full"
          aria-label={messages.aria}
          aria-haspopup="dialog"
          aria-busy={loading}
        >
          <HStack gap={1.5}>
            {loading ? <Spinner size="xs" /> : null}
            <Box as="span" whiteSpace="nowrap">
              {messages.label}
              {selectedCount > 0 ? ` (${selectedCount})` : ""}
            </Box>
          </HStack>
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content minW="260px" p={3} maxH="min(70vh, 360px)" overflowY="auto">
            <Stack gap={3} align="stretch">
              {loading ? (
                <HStack gap={2}>
                  <Spinner size="sm" />
                  <Text fontSize="sm" color="fg.muted">
                    {messages.loading}
                  </Text>
                </HStack>
              ) : terms.length === 0 ? (
                <Text fontSize="sm" color="fg.muted">
                  {messages.empty}
                </Text>
              ) : (
                <>
                  <Text fontSize="sm" fontWeight="semibold" color="fg.muted">
                    {messages.hint}
                  </Text>
                  <Stack gap={2} align="stretch">
                    {terms.map((term) => {
                      const checked = selectedSlugs.includes(term.slug);
                      return (
                        <Checkbox.Root
                          key={term.slug}
                          checked={checked}
                          onCheckedChange={(d) => {
                            const on = Boolean(d.checked);
                            const set = new Set(selectedSlugs);
                            if (on) {
                              set.add(term.slug);
                            } else {
                              set.delete(term.slug);
                            }
                            navigateWithSelection([...set]);
                          }}
                        >
                          <Checkbox.HiddenInput />
                          <Checkbox.Control />
                          <Checkbox.Label fontSize="sm">{term.name}</Checkbox.Label>
                        </Checkbox.Root>
                      );
                    })}
                  </Stack>
                </>
              )}
              {!loading && selectedCount > 0 ? (
                <Button size="xs" variant="ghost" onClick={() => navigateWithSelection([])}>
                  {messages.clear}
                </Button>
              ) : null}
            </Stack>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}

export const CatalogFilterBar = forwardRef<HTMLDivElement>(function CatalogFilterBar(_, ref) {
  const t = useTranslations("catalog");
  const category = useCatalogFilterStore((s) => s.category);
  const setCategory = useCatalogFilterStore((s) => s.setCategory);
  const origineSlugs = useCatalogFilterStore((s) => s.origineSlugs);
  const setOrigineSlugs = useCatalogFilterStore((s) => s.setOrigineSlugs);
  const regimeSlugs = useCatalogFilterStore((s) => s.regimeSlugs);
  const setRegimeSlugs = useCatalogFilterStore((s) => s.setRegimeSlugs);
  const facets = useProductsStore((s) => s.facets);
  const facetsStatus = useProductsStore((s) => s.facetsStatus);
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
          <AttributeFacetFilter
            paramName="origine"
            terms={facets?.origineTerms ?? []}
            selectedSlugs={origineSlugs}
            setSelectedSlugs={setOrigineSlugs}
            facetsStatus={facetsStatus}
            messages={{
              label: t("origineFilterLabel"),
              aria: t("origineFilterAria"),
              hint: t("origineFilterHint"),
              loading: t("origineFilterLoading"),
              empty: t("origineFilterEmpty"),
              clear: t("origineClear"),
            }}
          />
          <AttributeFacetFilter
            paramName="regime"
            terms={facets?.regimeTerms ?? []}
            selectedSlugs={regimeSlugs}
            setSelectedSlugs={setRegimeSlugs}
            facetsStatus={facetsStatus}
            messages={{
              label: t("regimeFilterLabel"),
              aria: t("regimeFilterAria"),
              hint: t("regimeFilterHint"),
              loading: t("regimeFilterLoading"),
              empty: t("regimeFilterEmpty"),
              clear: t("regimeClear"),
            }}
          />
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
