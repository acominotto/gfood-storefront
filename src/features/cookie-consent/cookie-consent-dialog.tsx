"use client";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Link } from "@/components/ui/link";
import {
  selectNeedsConsent,
  useCookieConsentStore,
} from "@/features/cookie-consent/cookie-consent-store";
import {
  Checkbox,
  HStack,
  IconButton,
  Stack,
  Text,
} from "@chakra-ui/react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FiX } from "react-icons/fi";

function CookieConsentPanel({
  showClose,
  analytics,
  marketing,
}: {
  showClose: boolean;
  analytics: boolean;
  marketing: boolean;
}) {
  const t = useTranslations("cookieConsent");
  const setChoices = useCookieConsentStore((s) => s.setChoices);
  const acceptAll = useCookieConsentStore((s) => s.acceptAll);
  const rejectOptional = useCookieConsentStore((s) => s.rejectOptional);

  const [draftAnalytics, setDraftAnalytics] = useState(analytics);
  const [draftMarketing, setDraftMarketing] = useState(marketing);

  return (
    <>
      <Dialog.Header borderBottomWidth="1px" borderColor="gray.200" pb={4}>
        <HStack justify="space-between" align="flex-start" gap={3} w="full">
          <Stack gap={1} align="flex-start" flex="1" minW={0}>
            <Dialog.Title fontWeight="semibold" fontSize="lg">
              {t("title")}
            </Dialog.Title>
            <Dialog.Description fontSize="sm" color="gray.600">
              {t("intro")}
            </Dialog.Description>
          </Stack>
          {showClose ? (
            <Dialog.CloseTrigger asChild>
              <IconButton variant="ghost" size="sm" aria-label={t("close")} flexShrink={0}>
                <FiX />
              </IconButton>
            </Dialog.CloseTrigger>
          ) : null}
        </HStack>
      </Dialog.Header>

      <Dialog.Body py={6}>
        <Stack gap={6} align="stretch">
          <Text fontSize="sm">
            <Link href="/privacy" variant="underline" textDecorationThickness="from-font">
              {t("privacyLink")}
            </Link>
          </Text>

          <Stack gap={4} align="stretch">
            <Stack gap={1}>
              <Text fontWeight="semibold" fontSize="sm">
                {t("categoryNecessaryTitle")}
              </Text>
              <Text fontSize="sm" color="gray.600">
                {t("categoryNecessaryBody")}
              </Text>
            </Stack>

            <Checkbox.Root
              checked={draftAnalytics}
              onCheckedChange={(e) => setDraftAnalytics(!!e.checked)}
            >
              <Checkbox.HiddenInput />
              <HStack gap={3} align="flex-start">
                <Checkbox.Control mt={0.5} />
                <Checkbox.Label cursor="pointer" flex="1">
                  <Stack gap={0.5} align="flex-start">
                    <Text fontWeight="medium">{t("categoryAnalyticsTitle")}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {t("categoryAnalyticsBody")}
                    </Text>
                  </Stack>
                </Checkbox.Label>
              </HStack>
            </Checkbox.Root>

            <Checkbox.Root
              checked={draftMarketing}
              onCheckedChange={(e) => setDraftMarketing(!!e.checked)}
            >
              <Checkbox.HiddenInput />
              <HStack gap={3} align="flex-start">
                <Checkbox.Control mt={0.5} />
                <Checkbox.Label cursor="pointer" flex="1">
                  <Stack gap={0.5} align="flex-start">
                    <Text fontWeight="medium">{t("categoryMarketingTitle")}</Text>
                    <Text fontSize="sm" color="gray.600">
                      {t("categoryMarketingBody")}
                    </Text>
                  </Stack>
                </Checkbox.Label>
              </HStack>
            </Checkbox.Root>
          </Stack>
        </Stack>
      </Dialog.Body>

      <Dialog.Footer
        borderTopWidth="1px"
        borderColor="gray.200"
        pt={4}
        flexDirection="column"
        alignItems="stretch"
        gap={3}
      >
        <Stack direction={{ base: "column", sm: "row" }} gap={3} w="full">
          <Button
            variant="outline"
            flex={{ base: "none", sm: 1 }}
            onClick={() => rejectOptional()}
          >
            {t("necessaryOnly")}
          </Button>
          <Button
            variant="outline"
            flex={{ base: "none", sm: 1 }}
            onClick={() => setChoices({ analytics: draftAnalytics, marketing: draftMarketing })}
          >
            {t("saveChoices")}
          </Button>
          <Button flex={{ base: "none", sm: 1 }} onClick={() => acceptAll()}>
            {t("acceptAll")}
          </Button>
        </Stack>
      </Dialog.Footer>
    </>
  );
}

export function CookieConsentRoot() {
  const [hydrated, setHydrated] = useState(false);
  const appliedVersion = useCookieConsentStore((s) => s.appliedVersion);
  const analytics = useCookieConsentStore((s) => s.analytics);
  const marketing = useCookieConsentStore((s) => s.marketing);
  const dialogSession = useCookieConsentStore((s) => s.dialogSession);
  const settingsOpen = useCookieConsentStore((s) => s.settingsOpen);
  const closeSettings = useCookieConsentStore((s) => s.closeSettings);

  useEffect(() => {
    const unsub = useCookieConsentStore.persist.onFinishHydration(() => {
      queueMicrotask(() => setHydrated(true));
    });
    return unsub;
  }, []);

  const needsConsent = hydrated && selectNeedsConsent({ appliedVersion, analytics, marketing });

  const dialogOpen = needsConsent || settingsOpen;

  const handleOpenChange = (open: boolean) => {
    if (!open && needsConsent) {
      return;
    }
    if (!open) {
      closeSettings();
    }
  };

  if (!hydrated) {
    return null;
  }

  return (
    <Dialog.Root
      open={dialogOpen}
      onOpenChange={(e) => handleOpenChange(e.open)}
      closeOnInteractOutside={!needsConsent}
      closeOnEscape={!needsConsent}
      size="lg"
    >
      <Dialog.Content maxH="90dvh" overflowY="auto">
        <CookieConsentPanel
          key={`${dialogSession}-${appliedVersion}`}
          showClose={!needsConsent}
          analytics={analytics}
          marketing={marketing}
        />
      </Dialog.Content>
    </Dialog.Root>
  );
}
