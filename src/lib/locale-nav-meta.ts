import { routing } from "@/i18n/routing";

export const LOCALE_NAV_META: Record<
  (typeof routing.locales)[number],
  { labelKey: "localeFrench" | "localeEnglish" | "localeGerman" | "localeItalian"; flagSrc: string }
> = {
  fr: {
    labelKey: "localeFrench",
    flagSrc: "https://flagcdn.com/w40/fr.png",
  },
  en: {
    labelKey: "localeEnglish",
    flagSrc: "https://flagcdn.com/w40/gb.png",
  },
  de: {
    labelKey: "localeGerman",
    flagSrc: "https://flagcdn.com/w40/de.png",
  },
  it: {
    labelKey: "localeItalian",
    flagSrc: "https://flagcdn.com/w40/it.png",
  },
};
