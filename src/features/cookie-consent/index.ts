export { COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_VERSION } from "@/features/cookie-consent/constants";
export { ConsentGatedAnalyticsScript, ConsentGatedMarketingScript } from "@/features/cookie-consent/consent-gated-script";
export { CookieConsentRoot } from "@/features/cookie-consent/cookie-consent-dialog";
export { CookieSettingsTrigger } from "@/features/cookie-consent/cookie-settings-trigger";
export {
  selectNeedsConsent,
  type CookieConsentPersisted,
  useCookieConsentStore,
} from "@/features/cookie-consent/cookie-consent-store";
export { useAnalyticsConsent, useMarketingConsent } from "@/features/cookie-consent/use-consent";
