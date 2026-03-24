"use client";

import { Menu as ChakraMenu, Portal } from "@chakra-ui/react";
import * as React from "react";
import { LuChevronRight } from "react-icons/lu";

interface MenuContentProps extends ChakraMenu.ContentProps {
  portalled?: boolean;
  portalRef?: React.RefObject<HTMLElement | null>;
}

export const MenuContent = React.forwardRef<HTMLDivElement, MenuContentProps>(
  function MenuContent(props, ref) {
    const { portalled = true, portalRef, ...rest } = props;
    return (
      <Portal disabled={!portalled} container={portalRef}>
        <ChakraMenu.Positioner>
          <ChakraMenu.Content ref={ref} {...rest} />
        </ChakraMenu.Positioner>
      </Portal>
    );
  },
);
MenuContent.displayName = "MenuContent";

export interface MenuTriggerItemProps extends ChakraMenu.ItemProps {
  startIcon?: React.ReactNode;
}

export const MenuTriggerItem = React.forwardRef<HTMLDivElement, MenuTriggerItemProps>(
  function MenuTriggerItem(props, ref) {
    const { startIcon, children, ...rest } = props;
    return (
      <ChakraMenu.TriggerItem ref={ref} {...rest}>
        {startIcon}
        {children}
        <LuChevronRight />
      </ChakraMenu.TriggerItem>
    );
  },
);
MenuTriggerItem.displayName = "MenuTriggerItem";

export const MenuRoot = ChakraMenu.Root;
export const MenuTrigger = ChakraMenu.Trigger;
export const MenuItem = ChakraMenu.Item;
export const MenuSeparator = ChakraMenu.Separator;
