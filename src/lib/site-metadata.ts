import { routing } from "@/i18n/routing";

export const siteName = "GASHI International Food";
export const defaultTitle = "G-Food — GASHI International Food";
export const description =
  "International food delivered in Switzerland. Les saveurs d’ailleurs — order online with G-Food.";

export const opengraphImageAlt =
  "GASHI International Food — Les saveurs d’ailleurs";

export const opengraphImageSize = { width: 1200, height: 630 };

const ogLocaleByAppLocale: Record<string, string> = {
  fr: "fr_CH",
  en: "en_CH",
  de: "de_CH",
  it: "it_CH",
};

export function openGraphForLocale(locale: string) {
  const ogLocale = ogLocaleByAppLocale[locale] ?? "fr_CH";
  const alternateLocale = routing.locales
    .filter((l) => l !== locale)
    .map((l) => ogLocaleByAppLocale[l] ?? `${l}_CH`);

  return {
    type: "website" as const,
    siteName,
    title: defaultTitle,
    description,
    locale: ogLocale,
    alternateLocale,
    images: [
      {
        url: "/opengraph-image",
        width: opengraphImageSize.width,
        height: opengraphImageSize.height,
        alt: opengraphImageAlt,
      },
    ],
  };
}
