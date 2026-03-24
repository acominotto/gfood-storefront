"use client";

import { Button } from "@/components/ui/button";
import { HStack, IconButton, Text } from "@chakra-ui/react";
import { FiTrash2 } from "react-icons/fi";

export type CartQuantityRowProps = {
  quantity: number;
  disabled?: boolean;
  /** When true, row is only as wide as controls need (e.g. cart drawer); default fills parent (product card). */
  compact?: boolean;
  onDecrease: () => void | Promise<void>;
  onIncrease: () => void | Promise<void>;
  onRemove: () => void | Promise<void>;
  removeAriaLabel: string;
};

/** Shared − / qty / + / remove layout for catalog cards and cart drawer. */
export function CartQuantityRow({
  quantity,
  disabled,
  compact = false,
  onDecrease,
  onIncrease,
  onRemove,
  removeAriaLabel,
}: CartQuantityRowProps) {
  return (
    <HStack gap={2} w={compact ? "fit-content" : "full"} maxW="100%">
      <Button size="sm" variant="outline" colorPalette="brand" disabled={disabled} onClick={() => void onDecrease()}>
        -
      </Button>
      <Text minW="24px" textAlign="center" fontWeight="semibold" flex={compact ? undefined : "1"}>
        {quantity}
      </Text>
      <Button size="sm" variant="outline" colorPalette="brand" disabled={disabled} onClick={() => void onIncrease()}>
        +
      </Button>
      <IconButton
        aria-label={removeAriaLabel}
        size="sm"
        variant="ghost"
        colorPalette="brand"
        disabled={disabled}
        onClick={() => void onRemove()}
      >
        <FiTrash2 />
      </IconButton>
    </HStack>
  );
}
