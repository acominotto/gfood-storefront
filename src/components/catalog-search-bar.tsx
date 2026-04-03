"use client";

import { Combobox } from "@/components/ui/combobox";
import { Box, Flex, IconButton } from "@chakra-ui/react";
import { LuSearch } from "react-icons/lu";

export type CatalogSearchBarProps = {
  width?: string;
  placeholder: string;
  searchAriaLabel: string;
  submitAriaLabel: string;
  onSubmit: (e: React.FormEvent) => void;
};

/**
 * Rounded search field + circular brand submit control. Lives inside {@link Combobox.Root} so the input stays wired to the combobox.
 */
export function CatalogSearchBar({
  width,
  placeholder,
  searchAriaLabel,
  submitAriaLabel,
  onSubmit,
}: CatalogSearchBarProps) {
  return (
    <Box as="form" onSubmit={onSubmit} w={width ?? "full"} display="block">
      <Flex
        w="full"
        align="center"
        gap={1.5}
        pl={3}
        pr={1.5}
        py={1}
        minH="10"
        borderWidth="1px"
        borderColor="gray.200"
        borderRadius="full"
        bg="white"
      >
        <Combobox.Control flex="1" minW={0} borderWidth={0} shadow="none" borderRadius="0">
          <Combobox.Input
            flex="1"
            minW={0}
            h="8"
            fontSize="sm"
            px={0}
            py={0}
            borderWidth={0}
            borderRadius="0"
            shadow="none"
            _focusVisible={{ shadow: "none" }}
            placeholder={placeholder}
            bg="transparent"
            textAlign="left"
            name="catalog-search"
            aria-label={searchAriaLabel}
          />
        </Combobox.Control>
        <IconButton
          type="submit"
          flexShrink={0}
          variant="solid"
          colorPalette="brand"
          borderRadius="full"
          boxSize="8"
          minW="8"
          aria-label={submitAriaLabel}
        >
          <LuSearch size={18} aria-hidden />
        </IconButton>
      </Flex>
    </Box>
  );
}
