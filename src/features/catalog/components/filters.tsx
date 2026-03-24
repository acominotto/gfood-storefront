"use client";

import { Button } from "@/components/ui/button";
import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import { useProductsStore } from "@/features/catalog/store/products-store";
import {
  Checkbox,
  Heading,
  HStack,
  Input,
  Portal,
  Select,
  Stack,
  createListCollection,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useMemo } from "react";

type CatalogFiltersProps = {
  onApply: () => void;
};

export function CatalogFilters({ onApply }: CatalogFiltersProps) {
  const t = useTranslations("catalog");
  const { search, category, minPrice, maxPrice, inStock, setField } = useCatalogFilterStore();
  const facets = useProductsStore((s) => s.facets);
  const fetchFacets = useProductsStore((s) => s.fetchFacets);

  useEffect(() => {
    void fetchFacets();
  }, [fetchFacets]);

  const categoryCollection = useMemo(() => {
    const categories = facets?.categories ?? [];
    return createListCollection({
      items: [
        { label: t("category"), value: "" },
        ...categories.map((c) => ({ label: c.name, value: String(c.id) })),
      ],
    });
  }, [facets, t]);

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
      <Select.Root
        collection={categoryCollection}
        size="sm"
        width="full"
        value={[category]}
        onValueChange={(e) => setField("category", e.value[0] ?? "")}
      >
        <Select.HiddenSelect />
        <Select.Control>
          <Select.Trigger bg="gray.50">
            <Select.ValueText placeholder={t("category")} />
          </Select.Trigger>
          <Select.IndicatorGroup>
            <Select.Indicator />
          </Select.IndicatorGroup>
        </Select.Control>
        <Portal>
          <Select.Positioner>
            <Select.Content>
              {categoryCollection.items.map((item) => (
                <Select.Item item={item} key={item.value === "" ? "__all__" : item.value}>
                  {item.label}
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Positioner>
        </Portal>
      </Select.Root>
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
      <Button onClick={onApply}>{t("apply")}</Button>
    </Stack>
  );
}
