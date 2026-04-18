"use client";

import { Button } from "@/components/ui/button";
import { useCookieConsentStore } from "@/features/cookie-consent/cookie-consent-store";
import { useTranslations } from "next-intl";

/** Opens the cookie preferences dialog (footer / menu). */
export function CookieSettingsTrigger() {
  const t = useTranslations("footer");
  const openSettings = useCookieConsentStore((s) => s.openSettings);

  return (
    <Button
      type="button"
      variant="ghost"
      height="auto"
      minH={0}
      px={0}
      py={0}
      fontSize="sm"
      color="gray.600"
      fontWeight="normal"
      textDecoration="underline"
      textUnderlineOffset="0.12em"
      _hover={{ color: "gray.800", bg: "transparent" }}
      onClick={() => openSettings()}
    >
      {t("cookieSettings")}
    </Button>
  );
}
