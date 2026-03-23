"use client";

import { getFacets, getProducts } from "@/features/catalog/api";
import { ProductCard } from "@/features/catalog/components/product-card";
import { useCatalogFilterStore } from "@/features/catalog/store/catalog-filters";
import type { Product } from "@/server/schemas/catalog";
import {
  Box,
  Button,
  Checkbox,
  Flex,
  Grid,
  HStack,
  Input,
  Pagination,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

function compareProductsByStockThenTitle(a: Product, b: Product) {
  const aInStock = Boolean(a.is_in_stock);
  const bInStock = Boolean(b.is_in_stock);
  if (aInStock !== bInStock) {
    return aInStock ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
}

/** Matches `SimpleGrid` `columns` so each loaded page is full rows. */
const CATALOG_GRID_COLUMNS = { base: 1, sm: 2, md: 3, lg: 3, xl: 4 } as const;
const ROWS_PER_CATALOG_PAGE = 3;

export function CatalogPage() {
  const t = useTranslations("catalog");
  const locale = useLocale();
  const router = useRouter();
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const [showBottomPager, setShowBottomPager] = useState(false);
  const [pagerExpanded, setPagerExpanded] = useState(false);
  const [activePage, setActivePage] = useState(1);

  const { search, category, minPrice, maxPrice, inStock, setField } = useCatalogFilterStore();

  const columnCount =
    useBreakpointValue(CATALOG_GRID_COLUMNS, { fallback: "md" }) ?? CATALOG_GRID_COLUMNS.md;
  const perPage = columnCount * ROWS_PER_CATALOG_PAGE;

  const baseQuery = useMemo(() => {
    const params = new URLSearchParams({
      perPage: String(perPage),
      orderBy: "title",
      order: "asc",
    });

    if (search) {
      params.set("search", search);
    }
    if (category) {
      params.set("category", category);
    }
    if (minPrice) {
      params.set("minPrice", minPrice);
    }
    if (maxPrice) {
      params.set("maxPrice", maxPrice);
    }
    if (inStock) {
      params.set("inStock", "true");
    }
    return params;
  }, [category, inStock, maxPrice, minPrice, perPage, search]);

  const productsQuery = useInfiniteQuery({
    queryKey: ["catalog-products", baseQuery.toString()],
    initialPageParam: 1,
    queryFn: ({ pageParam }) => {
      const params = new URLSearchParams(baseQuery.toString());
      params.set("page", String(pageParam));
      return getProducts(params);
    },
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages ? lastPage.pagination.page + 1 : undefined,
  });

  const facetsQuery = useQuery({
    queryKey: ["catalog-facets"],
    queryFn: getFacets,
  });

  const allProducts = useMemo(() => productsQuery.data?.pages.flatMap((entry) => entry.products) ?? [], [productsQuery.data]);
  const totalCount = productsQuery.data?.pages[0]?.pagination.total ?? 0;
  const totalPages = productsQuery.data?.pages[0]?.pagination.totalPages ?? 0;
  const loadedMaxPage = productsQuery.data?.pages[productsQuery.data.pages.length - 1]?.pagination.page ?? 1;

  function applyFilters() {
    const params = new URLSearchParams(baseQuery.toString());
    params.set("page", "1");
    router.push(`?${params.toString()}`);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function goToPage(nextPage: number) {
    if (nextPage > loadedMaxPage && productsQuery.hasNextPage) {
      for (let pageNumber = loadedMaxPage; pageNumber < nextPage; pageNumber += 1) {
        // Load missing pages so manual page navigation stays connected.
        await productsQuery.fetchNextPage();
      }
    }
    setActivePage(nextPage);
    requestAnimationFrame(() => {
      document.getElementById(`catalog-page-${nextPage}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  useEffect(() => {
    const element = loadMoreRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && productsQuery.hasNextPage && !productsQuery.isFetchingNextPage) {
          void productsQuery.fetchNextPage();
        }
      },
      { rootMargin: "200px 0px" },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [productsQuery.fetchNextPage, productsQuery.hasNextPage, productsQuery.isFetchingNextPage]);

  useEffect(() => {
    let lastY = window.scrollY;
    const onScroll = () => {
      const currentY = window.scrollY;
      const nearBottom = window.innerHeight + currentY >= document.body.scrollHeight - 220;
      const scrollingUp = currentY < lastY;
      setShowBottomPager(nearBottom && scrollingUp && totalPages > 1);
      if (!nearBottom || !scrollingUp) {
        setPagerExpanded(false);
      }
      lastY = currentY;
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [totalPages]);

  useEffect(() => {
    if (!productsQuery.data?.pages.length) return;

    const updateActivePageFromScroll = () => {
      const pageSections = productsQuery.data.pages
        .map((entry) => ({ page: entry.pagination.page, el: document.getElementById(`catalog-page-${entry.pagination.page}`) }))
        .filter((entry): entry is { page: number; el: HTMLElement } => Boolean(entry.el));
      if (pageSections.length === 0) return;
      const y = window.scrollY + window.innerHeight * 0.3;
      const current = pageSections.reduce((acc, item) => (item.el.offsetTop <= y ? item : acc), pageSections[0]);
      setActivePage(current.page);
    };

    updateActivePageFromScroll();
    window.addEventListener("scroll", updateActivePageFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateActivePageFromScroll);
  }, [productsQuery.data]);

  return (
    <Stack gap={{ base: 5, md: 8 }} minW={0} maxW="100%">
      <Box
        rounded="2xl"
        borderWidth="1px"
        borderColor="gray.200"
        bg="gray.50"
        p={{ base: 4, md: 7 }}
      >
        <Stack gap={2}>
          <Text fontSize={{ base: "2xl", md: "3xl" }} fontWeight="bold" color="gray.800">
            G-Food
          </Text>
          <Text fontSize={{ base: "sm", md: "md" }} color="gray.600">
            GASHI International Food - les saveurs d&apos;ailleurs a prix accessibles.
          </Text>
        </Stack>
      </Box>

      <Grid
        templateColumns={{ base: "1fr", lg: "300px minmax(0, 1fr)" }}
        gap={{ base: 4, md: 8 }}
        minW={0}
        w="full"
        maxW="100%"
      >
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
          <Text fontSize="xl" fontWeight="bold">
            {t("title")}
          </Text>
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setField("search", e.target.value)}
            bg="gray.50"
          />
          <select value={category} onChange={(e) => setField("category", e.target.value)}>
            <option value="">{t("category")}</option>
            {facetsQuery.data?.categories.map((option) => (
              <option key={option.id} value={String(option.id)}>
                {option.name}
              </option>
            ))}
          </select>
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
          <Button onClick={() => applyFilters()}>{t("apply")}</Button>
        </Stack>

        <Stack gap={6} minW={0} w="full">
          {productsQuery.isPending ? (
            <Flex justify="center" py={12}>
              <Spinner />
            </Flex>
          ) : (
            <>
              {allProducts.length > 0 ? (
                <Stack gap={{ base: 3, md: 6 }}>
                  {productsQuery.data?.pages.map((result) => (
                    <Box key={result.pagination.page} id={`catalog-page-${result.pagination.page}`} minW={0} w="full">
                      <SimpleGrid
                        columns={CATALOG_GRID_COLUMNS}
                        gap={{ base: 3, md: 5 }}
                        w="full"
                        minW={0}
                      >
                        {[...result.products].sort(compareProductsByStockThenTitle).map((product) => (
                          <ProductCard key={`${result.pagination.page}-${product.id}`} product={product} locale={locale} />
                        ))}
                      </SimpleGrid>
                    </Box>
                  ))}
                  <Box ref={loadMoreRef} h="1px" />
                  {productsQuery.isFetchingNextPage && (
                    <Flex justify="center" py={6}>
                      <Spinner />
                    </Flex>
                  )}
                </Stack>
              ) : (
                <Text>{t("noResults")}</Text>
              )}
            </>
          )}
        </Stack>
      </Grid>

      <Box
        position="fixed"
        left="50%"
        bottom={showBottomPager ? 4 : -200}
        transform="translateX(-50%)"
        zIndex={20}
        w={{ base: "calc(100% - 1rem)", md: "auto" }}
        transition="bottom 0.25s ease"
      >
        <Stack borderWidth="1px" borderColor="gray.200" rounded="xl" bg="white" shadow="lg" p={2} minW={{ md: "540px" }}>
          <HStack justify="space-between">
            <Text fontSize="sm" color="gray.600">
              Page {activePage} / {Math.max(totalPages, 1)}
            </Text>
            <Button size="xs" variant="ghost" onClick={() => setPagerExpanded((open) => !open)}>
              {pagerExpanded ? "Hide pages" : "Show pages"}
            </Button>
          </HStack>
          {pagerExpanded ? (
            <Pagination.Root count={totalCount} pageSize={perPage} page={activePage} onPageChange={(details) => void goToPage(details.page)}>
              <ButtonGroup activePage={activePage} />
            </Pagination.Root>
          ) : null}
        </Stack>
      </Box>
    </Stack>
  );
}

function ButtonGroup({ activePage }: { activePage: number }) {
  return (
    <HStack justify="center" wrap="wrap">
      <Pagination.PrevTrigger asChild>
        <Button size="sm" variant="outline">
          Prev
        </Button>
      </Pagination.PrevTrigger>
      <Pagination.Items
        render={(page) => (
          <Button variant={activePage === page.value ? "solid" : "outline"} size="sm">
            {page.value}
          </Button>
        )}
      />
      <Pagination.NextTrigger asChild>
        <Button size="sm" variant="outline">
          Next
        </Button>
      </Pagination.NextTrigger>
    </HStack>
  );
}
