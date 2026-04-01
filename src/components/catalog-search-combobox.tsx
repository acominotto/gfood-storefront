"use client";

import { CatalogSearchBar } from "@/components/catalog-search-bar";
import {
  ComboboxContent,
  ComboboxEmpty,
  ComboboxList,
  ComboboxRoot,
} from "@/components/ui/combobox";
import { getCatalogSuggest, type CatalogSuggestItem } from "@/features/catalog/api";
import { useNavbarStore } from "@/stores/navbar-store";
import {
  Box,
  ComboboxItem,
  ComboboxItemGroup,
  ComboboxItemGroupLabel,
  ComboboxItemText,
  createListCollection,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useMemo, useState } from "react";

const SUGGEST_DEBOUNCE_MS = 350;

function MatchHighlight({ text, query }: { text: string; query: string }) {
  const q = query.trim();
  if (!q) {
    return text;
  }
  const esc = q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(esc, "i");
  const m = text.match(re);
  if (!m || m.index === undefined) {
    return text;
  }
  const i = m.index;
  const len = m[0].length;
  return (
    <>
      {text.slice(0, i)}
      <Box as="mark" bg="yellow.100" color="inherit">
        {text.slice(i, i + len)}
      </Box>
      {text.slice(i + len)}
    </>
  );
}

type CatalogSearchComboboxProps = {
  width?: string;
};

export function CatalogSearchCombobox({ width }: CatalogSearchComboboxProps) {
  const tCatalog = useTranslations("catalog");
  const catalogSearch = useNavbarStore((s) => s.catalogSearch);
  const setCatalogSearch = useNavbarStore((s) => s.setCatalogSearch);

  const [draftQuery, setDraftQuery] = useState(() => useNavbarStore.getState().catalogSearch);

  useEffect(() => {
    setDraftQuery(catalogSearch);
  }, [catalogSearch]);

  const [suggestItems, setSuggestItems] = useState<CatalogSuggestItem[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  useEffect(() => {
    const q = draftQuery.trim();
    if (q.length === 0) {
      setSuggestItems([]);
      setSuggestLoading(false);
      return;
    }

    const ac = new AbortController();
    const id = window.setTimeout(() => {
      void (async () => {
        setSuggestLoading(true);
        try {
          const data = await getCatalogSuggest(q, { signal: ac.signal });
          if (!ac.signal.aborted) {
            setSuggestItems(data.items);
          }
        } catch {
          if (!ac.signal.aborted) {
            setSuggestItems([]);
          }
        } finally {
          if (!ac.signal.aborted) {
            setSuggestLoading(false);
          }
        }
      })();
    }, SUGGEST_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(id);
      ac.abort();
    };
  }, [draftQuery]);

  const collection = useMemo(
    () =>
      createListCollection<CatalogSuggestItem>({
        items: suggestItems,
        itemToValue: (item) => `${item.kind}:${item.id}`,
        itemToString: (item) => item.label,
        groupBy: (item) => item.kind,
        groupSort: ["product", "category"],
      }),
    [suggestItems],
  );

  const commitSearch = useCallback(
    (term: string) => {
      const next = term.trim();
      setCatalogSearch(next);
      setDraftQuery(next);
    },
    [setCatalogSearch],
  );

  const onSelect = useCallback(
    (detail: { itemValue: string }) => {
      const item = collection.find(detail.itemValue);
      if (!item) {
        return;
      }
      commitSearch(item.label);
    },
    [collection, commitSearch],
  );

  const groups = collection.group();

  function onSubmitSearch(e: React.FormEvent) {
    e.preventDefault();
    commitSearch(draftQuery);
  }

  return (
    <ComboboxRoot
      collection={collection}
      w={width ?? "full"}
      inputValue={draftQuery}
      onInputValueChange={(e) => {
        setDraftQuery(e.inputValue);
      }}
      value={[]}
      selectionBehavior="preserve"
      allowCustomValue
      openOnClick
      positioning={{ sameWidth: true, placement: "bottom-start" }}
      onSelect={onSelect}
    >
      <CatalogSearchBar
        width={width}
        placeholder={tCatalog("searchPlaceholder")}
        searchAriaLabel={tCatalog("searchPlaceholder")}
        submitAriaLabel={tCatalog("runSearch")}
        onSubmit={onSubmitSearch}
      />

      <ComboboxContent maxH="min(70vh, 22rem)" overflowY="auto" zIndex={1100} py={1}>
        {suggestLoading ? (
          <ComboboxEmpty py={3} px={3} color="fg.muted">
            {tCatalog("searching")}
          </ComboboxEmpty>
        ) : null}
        {!suggestLoading && draftQuery.trim().length > 0 && suggestItems.length === 0 ? (
          <ComboboxEmpty py={3} px={3} color="fg.muted">
            {tCatalog("noResults")}
          </ComboboxEmpty>
        ) : null}
        {!suggestLoading && suggestItems.length > 0 ? (
          <ComboboxList>
            {groups.map(([key, groupItems]) => (
              <ComboboxItemGroup key={key} id={key}>
                <ComboboxItemGroupLabel px={3} py={1} fontSize="xs" color="fg.muted">
                  {key === "product" ? tCatalog("suggestProducts") : tCatalog("suggestCategories")}
                </ComboboxItemGroupLabel>
                {groupItems.map((item) => (
                  <ComboboxItem key={`${item.kind}:${item.id}`} item={item} py={2} px={3}>
                    <ComboboxItemText>
                      <MatchHighlight text={item.label} query={draftQuery} />
                    </ComboboxItemText>
                  </ComboboxItem>
                ))}
              </ComboboxItemGroup>
            ))}
          </ComboboxList>
        ) : null}
      </ComboboxContent>
    </ComboboxRoot>
  );
}
