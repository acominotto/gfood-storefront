"use client";

import { Button } from "@/components/ui/button";
import {
  ComboboxContent,
  ComboboxControl,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxItemGroup,
  ComboboxItemText,
  ComboboxLabel,
  ComboboxRoot,
} from "@/components/ui/combobox";
import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useProductsStore } from "@/features/catalog/store/products-store";
import { buildCategoryFilterComboboxData, type CategorySelectItem } from "@/lib/category-tree";
import { Box, Checkbox, createListCollection, Heading, HStack, Input, Stack } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

type CatalogFiltersProps = {
  onApply: () => void;
};

export function CatalogFilters({ onApply }: CatalogFiltersProps) {
  const t = useTranslations("catalog");
  const {
    search,
    category,
    minPrice,
    maxPrice,
    inStock,
    categoryComboboxFilter,
    setField,
    setCategoryComboboxFilter,
  } = useCatalogFilterStore();
  const facets = useProductsStore((s) => s.facets);
  const fetchFacets = useProductsStore((s) => s.fetchFacets);

  useEffect(() => {
    void fetchFacets();
  }, [fetchFacets]);

  const { collection, displayGroups, allOption, showAllOption } = useMemo(() => {
    const categories = facets?.categories ?? [];
    const built = buildCategoryFilterComboboxData(categories, t("category"));
    const q = categoryComboboxFilter.trim().toLowerCase();

    const itemVisible = (item: CategorySelectItem) => {
      if (!q) return true;
      if (category && item.value === category) return true;
      return item.label.trim().toLowerCase().includes(q);
    };

    const groupHeadingMatches = (heading: string) => heading.trim().toLowerCase().includes(q);

    const showAll = !q || built.allOption.label.toLowerCase().includes(q);

    if (!q) {
      return {
        collection: createListCollection({ items: built.flatItems }),
        displayGroups: built.groups,
        allOption: built.allOption,
        showAllOption: true,
      };
    }

    const displayGroups = built.groups
      .map((g) => ({
        ...g,
        items: g.items.filter((item) => itemVisible(item) || groupHeadingMatches(g.heading)),
      }))
      .filter((g) => g.items.length > 0);

    const collectionItems: CategorySelectItem[] = [
      ...(showAll ? [built.allOption] : []),
      ...displayGroups.flatMap((g) => g.items),
    ];

    return {
      collection: createListCollection({ items: collectionItems }),
      displayGroups,
      allOption: built.allOption,
      showAllOption: showAll,
    };
  }, [facets, t, categoryComboboxFilter, category]);

  return (
    <Stack
      gap={4}
      borderWidth="1px"
      rounded="xl"
      p={{ base: 3, md: 5 }}
      minW={0}
      h="fit-content"
      bg="white"
      position={{ base: "static", lg: "sticky" }}
      top="100px"
    >
      <Heading size="xl">
        {t("title")}
      </Heading>
      <Input
        placeholder={t("searchPlaceholder")}
        value={search}
        onChange={(e) => setField("search", e.target.value)}
        bg="gray.50"
      />

      <Box minW={0}>
        <ComboboxRoot
          collection={collection}
          size="sm"
          width="full"
          value={category === "" ? [] : [category]}
          onValueChange={(e) => setField("category", e.value[0] ?? "")}
          onInputValueChange={(e) => setCategoryComboboxFilter(e.inputValue)}
          selectionBehavior="replace"
          allowCustomValue={false}
        >
          <ComboboxLabel srOnly>{t("category")}</ComboboxLabel>
          <ComboboxControl clearable>
            <ComboboxInput placeholder={t("category")} bg="gray.50" />
          </ComboboxControl>
          <ComboboxContent maxH="min(60vh, 320px)" overflowY="auto">
            <ComboboxEmpty py={2} px={3}>
              {t("noResults")}
            </ComboboxEmpty>
            {showAllOption ? (
              <ComboboxItem item={allOption} key="__all__">
                <ComboboxItemText>{allOption.label}</ComboboxItemText>
              </ComboboxItem>
            ) : null}
            {displayGroups.map((group) => (
              <ComboboxItemGroup key={group.heading} label={group.heading}>
                {group.items.map((item) => (
                  <ComboboxItem key={item.value} item={item}>
                    <ComboboxItemText>{item.label}</ComboboxItemText>
                  </ComboboxItem>
                ))}
              </ComboboxItemGroup>
            ))}
          </ComboboxContent>
        </ComboboxRoot>
      </Box>

      <HStack>
        <Input
          placeholder={t("minPrice")}
          value={minPrice}
          onChange={(e) => setField("minPrice", e.target.value)}
          bg="gray.50"
        />
        <Input
          placeholder={t("maxPrice")}
          value={maxPrice}
          onChange={(e) => setField("maxPrice", e.target.value)}
          bg="gray.50"
        />
      </HStack>
      <Checkbox.Root checked={inStock} onCheckedChange={(e) => setField("inStock", Boolean(e.checked))}>
        <Checkbox.HiddenInput />
        <Checkbox.Control />
        <Checkbox.Label>{t("inStockOnly")}</Checkbox.Label>
      </Checkbox.Root>
      <Button onClick={onApply} colorPalette="brand" rounded="full">{t("apply")}</Button>
    </Stack>
  );
}
