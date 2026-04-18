"use client";

import { COOKIE_CONSENT_VERSION } from "@/features/cookie-consent/constants";
import { useCookieConsentStore } from "@/features/cookie-consent/cookie-consent-store";

/** True only after the user has completed consent for the current {@link COOKIE_CONSENT_VERSION} and enabled analytics. */
export function useAnalyticsConsent(): boolean {
  return useCookieConsentStore(
    (s) => s.appliedVersion >= COOKIE_CONSENT_VERSION && s.analytics,
  );
}

/** True only after the user has completed consent for the current version and enabled marketing / third-party ads cookies. */
export function useMarketingConsent(): boolean {
  return useCookieConsentStore(
    (s) => s.appliedVersion >= COOKIE_CONSENT_VERSION && s.marketing,
  );
}
