"use client";

import { Button } from "@/components/ui/button";
import { HStack, IconButton, Text } from "@chakra-ui/react";
import { FiTrash2 } from "react-icons/fi";

export type CartQuantityRowProps = {
  quantity: number;
  disabled?: boolean;
  /** When true, row is only as wide as controls need (e.g. cart drawer); default fills parent (product card). */
  compact?: boolean;
  /** Smaller controls and typography (e.g. product cards). */
  dense?: boolean;
  /** Narrow layout: minimal gaps (use with `dense` on small cards). */
  tight?: boolean;
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
  dense = false,
  tight = false,
  onDecrease,
  onIncrease,
  onRemove,
  removeAriaLabel,
}: CartQuantityRowProps) {
  const btnSize = dense ? "xs" : "sm";
  const gap = tight ? 0 : dense ? 1 : 2;
  const qtyMinW = tight ? "14px" : dense ? "18px" : "24px";
  const qtyFontSize = tight ? "2xs" : dense ? "xs" : undefined;
  const trashSize = tight ? 11 : dense ? 14 : undefined;
  return (
    <HStack gap={gap} w={compact ? "fit-content" : "full"} maxW="100%">
      <Button size={btnSize} variant="outline" colorPalette="brand" disabled={disabled} onClick={() => void onDecrease()}>
        -
      </Button>
      <Text
        minW={qtyMinW}
        textAlign="center"
        fontWeight="semibold"
        fontSize={qtyFontSize}
        flex={compact ? undefined : "1"}
      >
        {quantity}
      </Text>
      <Button size={btnSize} variant="outline" colorPalette="brand" disabled={disabled} onClick={() => void onIncrease()}>
        +
      </Button>
      <IconButton
        aria-label={removeAriaLabel}
        size={btnSize}
        variant="ghost"
        colorPalette="brand"
        disabled={disabled}
        onClick={() => void onRemove()}
      >
        <FiTrash2 size={trashSize} />
      </IconButton>
    </HStack>
  );
}
