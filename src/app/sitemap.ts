import type { MetadataRoute } from "next";
import { env } from "@/lib/env";
import { routing } from "@/i18n/routing";
import { productSegment } from "@/lib/product-url";
import { fetchAllProductsForSitemap } from "@/server/product-catalog";

/** Avoid build-time Woo pagination (can exceed static generation timeout). */
export const dynamic = "force-dynamic";

function baseUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

function localeAlternates(path: string): Record<string, string> {
  const b = baseUrl();
  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${b}/${l}${path}`;
  }
  languages["x-default"] = `${b}/${routing.defaultLocale}${path}`;
  return languages;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const b = baseUrl();
  const entries: MetadataRoute.Sitemap = [];

  const staticPaths: { path: string; changeFrequency: MetadataRoute.Sitemap[0]["changeFrequency"]; priority: number }[] = [
    { path: "", changeFrequency: "weekly", priority: 0.9 },
    { path: "/privacy", changeFrequency: "monthly", priority: 0.6 },
    { path: "/impressum", changeFrequency: "monthly", priority: 0.5 },
  ];

  for (const { path, changeFrequency, priority } of staticPaths) {
    entries.push({
      url: `${b}/${routing.defaultLocale}${path}`,
      changeFrequency,
      priority,
      alternates: {
        languages: localeAlternates(path),
      },
    });
  }

  let products: Awaited<ReturnType<typeof fetchAllProductsForSitemap>> = [];
  try {
    products = await fetchAllProductsForSitemap();
  } catch {
    // Still publish static routes if catalog fetch fails
  }

  for (const product of products) {
    const path = `/p/${productSegment(product)}`;
    entries.push({
      url: `${b}/${routing.defaultLocale}${path}`,
      changeFrequency: "weekly",
      priority: 0.8,
      alternates: {
        languages: localeAlternates(path),
      },
    });
  }

  return entries;
}
