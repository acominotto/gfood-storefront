import type { Metadata } from "next";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ProductDetailView } from "@/features/catalog/components/product-detail-view";
import { env } from "@/lib/env";
import { stripHtmlToPlainText } from "@/lib/html-plain";
import { parseProductSegment, productPath, productSegment, segmentsMatchCanonical } from "@/lib/product-url";
import { openGraphForLocale, siteName } from "@/lib/site-metadata";
import { routing } from "@/i18n/routing";
import { redirect } from "@/i18n/navigation";
import { fetchProductById } from "@/server/product-catalog";
import { productOrigineAndRegimeTerms } from "@/server/regime-attribute";
import type { Product } from "@/server/schemas/catalog";
import { getAllProductCategories } from "@/server/woo-taxonomies";

type Props = {
  params: Promise<{ locale: string; segment: string }>;
};

function baseUrl(): string {
  return env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
}

function absoluteProductUrl(locale: string, product: Product): string {
  return `${baseUrl()}/${locale}/p/${productSegment(product)}`;
}

function ogImageUrl(product: Product): string | undefined {
  const src = product.images[0]?.src;
  if (!src) {
    return undefined;
  }
  const path = new URL(src, "https://g-food.ch").pathname.replace(/^\//, "");
  return `${baseUrl()}/api/images/${path}?q=82&fit=contain&bg=remove&format=webp`;
}

function buildProductJsonLd(locale: string, product: Product): Record<string, unknown> {
  const pageUrl = absoluteProductUrl(locale, product);
  const images = product.images.map((img) => img.src).filter(Boolean);
  const currency = product.prices?.currency_code ?? "CHF";
  const priceMinor = product.prices?.price;
  const priceDecimal =
    priceMinor !== undefined && priceMinor !== "" ? (Number(priceMinor) / 100).toFixed(2) : undefined;

  const offer: Record<string, unknown> = {
    "@type": "Offer",
    priceCurrency: currency,
    url: pageUrl,
    availability: product.is_in_stock
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock",
  };
  if (priceDecimal !== undefined && !Number.isNaN(Number(priceDecimal))) {
    offer.price = priceDecimal;
  }

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: stripHtmlToPlainText(product.short_description) || product.name,
    image: images.length > 0 ? images : undefined,
    offers: offer,
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, segment } = await params;
  const parsed = parseProductSegment(segment);
  if (!parsed || !hasLocale(routing.locales, locale)) {
    return { title: siteName };
  }

  const product = await fetchProductById(parsed.id);
  if (!product) {
    return { title: siteName };
  }

  const canonicalSeg = productSegment(product);
  const b = baseUrl();
  const description = stripHtmlToPlainText(product.short_description) || product.name;
  const title = `${product.name} | ${siteName}`;
  const canonical = `${b}/${locale}/p/${canonicalSeg}`;
  const og = openGraphForLocale(locale);
  const ogImg = ogImageUrl(product);

  const languages: Record<string, string> = {};
  for (const l of routing.locales) {
    languages[l] = `${b}/${l}/p/${canonicalSeg}`;
  }
  languages["x-default"] = `${b}/${routing.defaultLocale}/p/${canonicalSeg}`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      ...og,
      title,
      description,
      url: canonical,
      images: ogImg
        ? [
            {
              url: ogImg,
              width: 1200,
              height: 1200,
              alt: product.name,
            },
          ]
        : og.images,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImg ? [ogImg] : undefined,
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { locale, segment } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  const parsed = parseProductSegment(segment);
  if (!parsed) {
    notFound();
  }

  const [product, categories] = await Promise.all([
    fetchProductById(parsed.id),
    getAllProductCategories(),
  ]);
  if (!product) {
    notFound();
  }

  if (!segmentsMatchCanonical(parsed.slugTail, product)) {
    redirect({ href: productPath(product), locale });
  }

  const jsonLd = buildProductJsonLd(locale, product);
  const { origine: origineTerms, regime: regimeTerms } = productOrigineAndRegimeTerms(product);

  return (
    <>
      <script
        type="application/ld+json"
        // JSON-LD: product fields come from validated Woo payload
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ProductDetailView
        product={product}
        locale={locale}
        categories={categories}
        origineTerms={origineTerms}
        regimeTerms={regimeTerms}
      />
    </>
  );
}
