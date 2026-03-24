"use client";

import { ProductPlaceholder } from "@/components/product-placeholder";
import { useTranslations } from "next-intl";

export function ProductImagePlaceholder() {
  const t = useTranslations("catalog");
  return <ProductPlaceholder text={t("imageComingSoon")} />;
}
