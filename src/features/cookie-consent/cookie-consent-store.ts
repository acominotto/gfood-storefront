import { COOKIE_CONSENT_STORAGE_KEY, COOKIE_CONSENT_VERSION } from "@/features/cookie-consent/constants";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type CookieConsentPersisted = {
  appliedVersion: number;
  analytics: boolean;
  marketing: boolean;
};

type CookieConsentState = CookieConsentPersisted & {
  settingsOpen: boolean;
  /** Bumps when the preferences dialog is opened so the panel remounts with fresh draft toggles. Not persisted. */
  dialogSession: number;
  openSettings: () => void;
  closeSettings: () => void;
  setChoices: (choices: Pick<CookieConsentPersisted, "analytics" | "marketing">) => void;
  acceptAll: () => void;
  rejectOptional: () => void;
};

export const useCookieConsentStore = create<CookieConsentState>()(
  persist(
    (set) => ({
      appliedVersion: 0,
      analytics: false,
      marketing: false,
      settingsOpen: false,
      dialogSession: 0,
      openSettings: () =>
        set((s) => ({
          settingsOpen: true,
          dialogSession: s.dialogSession + 1,
        })),
      closeSettings: () => set({ settingsOpen: false }),
      setChoices: ({ analytics, marketing }) =>
        set({
          analytics,
          marketing,
          appliedVersion: COOKIE_CONSENT_VERSION,
          settingsOpen: false,
        }),
      acceptAll: () =>
        set({
          analytics: true,
          marketing: true,
          appliedVersion: COOKIE_CONSENT_VERSION,
          settingsOpen: false,
        }),
      rejectOptional: () =>
        set({
          analytics: false,
          marketing: false,
          appliedVersion: COOKIE_CONSENT_VERSION,
          settingsOpen: false,
        }),
    }),
    {
      name: COOKIE_CONSENT_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      partialize: (s): CookieConsentPersisted => ({
        appliedVersion: s.appliedVersion,
        analytics: s.analytics,
        marketing: s.marketing,
      }),
    },
  ),
);

export function selectNeedsConsent(s: CookieConsentPersisted): boolean {
  return s.appliedVersion < COOKIE_CONSENT_VERSION;
}
