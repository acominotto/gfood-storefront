"use client";

import { useCartStore } from "@/features/cart/store/cart-store";
import { CatalogPromoPlaceholder } from "@/features/catalog/components/catalog-promo-placeholder";
import { CatalogFilterBar } from "@/features/catalog/components/filters";
import { ProductCard } from "@/features/catalog/components/product-card";
import { useIntersectionFetchNext } from "@/features/catalog/hooks/use-intersection-fetch-next";
import { useResizeObserverHeight } from "@/features/catalog/hooks/use-resize-observer-height";
import { useSyncCatalogFiltersFromSearchParams } from "@/features/catalog/hooks/use-sync-catalog-filters-from-url";
import { useSyncCatalogSearchToUrl } from "@/features/catalog/hooks/use-sync-catalog-search-to-url";
import { selectHasNextPage, useProductsStore } from "@/features/catalog/store/products-store";
import { useSyncCatalogProducts } from "@/features/catalog/store/use-sync-catalog-products";
import { useScrollRevealBar } from "@/hooks/use-scroll-reveal-bar";
import { useNavbarStore } from "@/stores/navbar-store";
import { useStorefrontTopNavHeight } from "@/hooks/use-storefront-top-nav-height";
import type { Product } from "@/server/schemas/catalog";
import { Button } from "@/components/ui/button";
import {
  Box,
  Flex,
  HStack,
  Pagination,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from "react";

/** Matches `SimpleGrid` `columns` so each loaded page is full rows. Max columns × rows ≤ 48 (API `perPage` cap). */
const CATALOG_GRID_COLUMNS = { base: 1, sm: 2, md: 3, lg: 4, xl: 5, "2xl": 6 } as const;
const ROWS_PER_CATALOG_PAGE = 8;

const MOBILE_CHROME_BOTTOM = "calc(1rem + 4.5rem + env(safe-area-inset-bottom, 0px))";

/** Extra space below the fixed filter on md+ so the hero / grid don’t crowd the bar (shadow, subpixel sizing). */
const FILTER_BAR_STACK_GAP_MD = 20;

export function CatalogPage() {
  const t = useTranslations("catalog");
  const locale = useLocale();
  useSyncCatalogFiltersFromSearchParams();
  useSyncCatalogSearchToUrl();
  const openCart = useCartStore((s) => s.openCart);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const filterBarRef = useRef<HTMLDivElement | null>(null);
  const [showBottomPager, setShowBottomPager] = useState(false);
  const [pagerExpanded, setPagerExpanded] = useState(false);
  const [activePage, setActivePage] = useState(1);

  const filterBarVisible = useScrollRevealBar();
  const topNavHeightPx = useStorefrontTopNavHeight();
  const filterBarTop = topNavHeightPx > 0 ? `${topNavHeightPx}px` : "0";

  const columnCount =
    useBreakpointValue(CATALOG_GRID_COLUMNS, { fallback: "md" }) ?? CATALOG_GRID_COLUMNS.md;
  const filterStackExtraPx =
    useBreakpointValue({ base: 0, md: FILTER_BAR_STACK_GAP_MD }, { fallback: "md" }) ?? 0;
  const perPage = columnCount * ROWS_PER_CATALOG_PAGE;

  const { appliedSearch } = useSyncCatalogProducts(perPage);
  const catalogSearch = useNavbarStore((s) => s.catalogSearch);

  const filterBarHeight = useResizeObserverHeight(filterBarRef);

  const pages = useProductsStore((s) => s.pages);
  const productsStatus = useProductsStore((s) => s.status);
  const productsError = useProductsStore((s) => s.error);
  const isFetchingNextPage = useProductsStore((s) => s.isFetchingNextPage);
  const fetchNextPage = useProductsStore((s) => s.fetchNextPage);
  const hasNextPage = useProductsStore(selectHasNextPage);

  const needsClientSearchFilter = useMemo(() => {
    const q = catalogSearch.trim();
    if (!q) {
      return false;
    }
    return (
      catalogSearch !== appliedSearch ||
      (productsStatus === "loading" && pages.length > 0)
    );
  }, [appliedSearch, catalogSearch, pages.length, productsStatus]);

  const displayPages = useMemo(() => {
    if (!needsClientSearchFilter) {
      return pages;
    }
    const needle = catalogSearch.trim().toLowerCase();
    return pages
      .map((result) => ({
        ...result,
        products: result.products.filter((p) => productMatchesQuery(p, needle)),
      }))
      .filter((result) => result.products.length > 0);
  }, [catalogSearch, needsClientSearchFilter, pages]);

  const showSearchInProgress =
    catalogSearch.trim() !== "" &&
    (catalogSearch !== appliedSearch || (productsStatus === "loading" && pages.length > 0));

  const allProducts = useMemo(() => displayPages.flatMap((entry) => entry.products), [displayPages]);
  const totalCount = pages[0]?.pagination.total ?? 0;
  const totalPages = pages[0]?.pagination.totalPages ?? 0;

  useIntersectionFetchNext({
    targetRef: loadMoreRef,
    hasNextPage,
    isFetching: isFetchingNextPage,
    fetchNext: fetchNextPage,
  });

  useCatalogBottomPager(totalPages, setShowBottomPager, setPagerExpanded);
  useCatalogActivePageFromScroll(displayPages, setActivePage);

  const spacerHeight = filterBarVisible ? filterBarHeight + filterStackExtraPx : 0;

  return (
    <Stack gap={{ base: 5, md: 8 }} minW={0} maxW="100%">
      <Box
        position="fixed"
        left={0}
        right={0}
        top={filterBarTop}
        zIndex={900}
        minW={0}
        transform={filterBarVisible ? "translateY(0)" : "translateY(-100%)"}
        transition="transform 0.22s ease"
        pointerEvents={filterBarVisible ? "auto" : "none"}
      >
        <CatalogFilterBar ref={filterBarRef} />
      </Box>

      <Box
        h={`${spacerHeight}px`}
        minH={0}
        overflow="hidden"
        transition="height 0.22s ease"
        aria-hidden
        flexShrink={0}
      />

      <CatalogPromoPlaceholder />

      <Stack gap={6} minW={0} w="full">
        {productsStatus === "loading" && pages.length === 0 ? (
          <Flex justify="center" py={12}>
            <Spinner />
          </Flex>
        ) : productsStatus === "error" ? (
          <Text color="red.600">{productsError ?? t("noResults")}</Text>
        ) : (
          <>
            {allProducts.length > 0 ? (
              <Stack gap={{ base: 3, md: 6 }}>
                {displayPages.map((result) => (
                  <Box key={result.pagination.page} id={catalogPageSectionId(result.pagination.page)} minW={0} w="full">
                    <SimpleGrid
                      columns={CATALOG_GRID_COLUMNS}
                      gap={{ base: 3, md: 4 }}
                      w="full"
                      minW={0}
                    >
                      {[...result.products].sort(compareProductsByStockThenTitle).map((product) => (
                        <ProductCard
                          key={`${result.pagination.page}-${product.id}`}
                          product={product}
                          locale={locale}
                          onOpenCart={openCart}
                        />
                      ))}
                    </SimpleGrid>
                  </Box>
                ))}
                <Box ref={loadMoreRef} h="1px" />
                {showSearchInProgress ? (
                  <Flex justify="center" align="center" gap={3} py={8}>
                    <Spinner size="md" color="brand.500" css={{ animationDuration: "0.85s" }} />
                    <Text color="gray.600">{t("searching")}</Text>
                  </Flex>
                ) : null}
                {isFetchingNextPage && !showSearchInProgress ? (
                  <Flex justify="center" py={6}>
                    <Spinner />
                  </Flex>
                ) : null}
              </Stack>
            ) : (
              <Stack gap={4}>
                {showSearchInProgress ? (
                  <Flex justify="center" align="center" gap={3} py={8}>
                    <Spinner size="md" color="brand.500" />
                    <Text color="gray.600">{t("searching")}</Text>
                  </Flex>
                ) : (
                  <Text>{t("noResults")}</Text>
                )}
              </Stack>
            )}
          </>
        )}
      </Stack>

      <Box
        position="fixed"
        left="50%"
        bottom={
          showBottomPager
            ? { base: MOBILE_CHROME_BOTTOM, md: 4 }
            : -200
        }
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
            <Pagination.Root count={totalCount} pageSize={perPage} page={activePage} onPageChange={(details) => void goToCatalogPage(details.page, setActivePage)}>
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

function catalogPageSectionId(page: number) {
  return `catalog-page-${page}`;
}

function productMatchesQuery(product: Product, needleLower: string): boolean {
  const haystacks = [
    product.name,
    product.slug,
    product.short_description ?? "",
    ...(product.categories?.map((c) => c.name) ?? []),
  ];
  return haystacks.some((s) => s.toLowerCase().includes(needleLower));
}

function compareProductsByStockThenTitle(a: Product, b: Product) {
  const aInStock = Boolean(a.is_in_stock);
  const bInStock = Boolean(b.is_in_stock);
  if (aInStock !== bInStock) {
    return aInStock ? -1 : 1;
  }
  return a.name.localeCompare(b.name, undefined, { sensitivity: "base", numeric: true });
}

function useCatalogBottomPager(
  totalPages: number,
  setShowBottomPager: Dispatch<SetStateAction<boolean>>,
  setPagerExpanded: Dispatch<SetStateAction<boolean>>,
) {
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
  }, [totalPages, setShowBottomPager, setPagerExpanded]);
}

function useCatalogActivePageFromScroll(
  pages: Array<{ pagination: { page: number } }>,
  setActivePage: Dispatch<SetStateAction<number>>,
) {
  useEffect(() => {
    if (!pages.length) {
      return;
    }

    const updateActivePageFromScroll = () => {
      const pageSections = pages
        .map((entry) => ({
          page: entry.pagination.page,
          el: document.getElementById(catalogPageSectionId(entry.pagination.page)),
        }))
        .filter((entry): entry is { page: number; el: HTMLElement } => Boolean(entry.el));
      if (pageSections.length === 0) {
        return;
      }
      const y = window.scrollY + window.innerHeight * 0.3;
      const current = pageSections.reduce((acc, item) => (item.el.offsetTop <= y ? item : acc), pageSections[0]);
      setActivePage(current.page);
    };

    updateActivePageFromScroll();
    window.addEventListener("scroll", updateActivePageFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateActivePageFromScroll);
  }, [pages, setActivePage]);
}

async function goToCatalogPage(nextPage: number, setActivePage: Dispatch<SetStateAction<number>>) {
  let loadedMax = useProductsStore.getState().pages.at(-1)?.pagination.page ?? 1;
  while (nextPage > loadedMax && selectHasNextPage(useProductsStore.getState())) {
    await useProductsStore.getState().fetchNextPage();
    loadedMax = useProductsStore.getState().pages.at(-1)?.pagination.page ?? 1;
  }
  setActivePage(nextPage);
  requestAnimationFrame(() => {
    document.getElementById(catalogPageSectionId(nextPage))?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
