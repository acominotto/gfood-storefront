"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  HStack,
  IconButton,
  Link,
  Portal,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { FiX } from "react-icons/fi";

export function NavDeliveryDialog() {
  const tNav = useTranslations("nav");
  const t = useTranslations("delivery");

  return (
    <Dialog.Root size="md">
      <Dialog.Trigger asChild>
        <Link variant="underline" asChild>
          <button type="button">{tNav("delivery")}</button>
        </Link>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
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
                <Text color="gray.700">{t("freeFrom")}</Text>
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
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
