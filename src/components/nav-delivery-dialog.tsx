"use client";

import { DeliveryInfoDialog } from "@/components/delivery-info-dialog";
import { Link } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

export function NavDeliveryDialog() {
  const tNav = useTranslations("nav");

  return (
    <DeliveryInfoDialog
      trigger={
        <Link variant="underline" asChild>
          <button type="button">{tNav("delivery")}</button>
        </Link>
      }
    />
  );
}
