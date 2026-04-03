"use client";

import { DELIVERY_FREE_THRESHOLD_CHF } from "@/constants/delivery";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { HStack, IconButton, Stack, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiX } from "react-icons/fi";
import type { ReactNode } from "react";

function DeliveryDialogPanel() {
  const t = useTranslations("delivery");

  return (
    <>
      <Dialog.Header borderBottomWidth="1px" borderColor="gray.200" pb={4}>
        <HStack justify="space-between" align="flex-start" gap={3} w="full">
          <Dialog.Title fontWeight="semibold" fontSize="lg">
            {t("title")}
          </Dialog.Title>
          <Dialog.CloseTrigger asChild>
            <IconButton variant="ghost" size="sm" aria-label={t("close")} flexShrink={0}>
              <FiX />
            </IconButton>
          </Dialog.CloseTrigger>
        </HStack>
      </Dialog.Header>
      <Dialog.Body py={6}>
        <Stack gap={4}>
          <Text color="gray.700">{t("intro")}</Text>
          <Text color="gray.700">
            {t("freeFrom", { amount: DELIVERY_FREE_THRESHOLD_CHF })}
          </Text>
          <Text fontSize="sm" color="gray.600">
            {t("note")}
          </Text>
        </Stack>
      </Dialog.Body>
      <Dialog.Footer borderTopWidth="1px" borderColor="gray.200" pt={4}>
        <Dialog.ActionTrigger asChild>
          <Button variant="outline" size="sm">
            {t("close")}
          </Button>
        </Dialog.ActionTrigger>
      </Dialog.Footer>
    </>
  );
}

type DeliveryInfoDialogTriggerProps = {
  trigger: ReactNode;
};

/** Uncontrolled: wraps a trigger that opens the delivery info dialog. */
export function DeliveryInfoDialog({ trigger }: DeliveryInfoDialogTriggerProps) {
  return (
    <Dialog.Root size="md">
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Content>
        <DeliveryDialogPanel />
      </Dialog.Content>
    </Dialog.Root>
  );
}

type DeliveryInfoDialogControlledProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Controlled delivery dialog (e.g. open after closing another surface). */
export function DeliveryInfoDialogControlled({ open, onOpenChange }: DeliveryInfoDialogControlledProps) {
  return (
    <Dialog.Root size="md" open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Content>
        <DeliveryDialogPanel />
      </Dialog.Content>
    </Dialog.Root>
  );
}
