import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { OrdersPageContent } from "@/features/orders/components/orders-page-content";
import { formatWooOrderTotalDecimal } from "@/lib/format-woo-order-total";
import { wooOrderReceivedUrl } from "@/lib/woo-order-received-url";
import { authOptions } from "@/server/auth-options";
import {
  listOrdersForSignedInAccount,
  resolveWooCustomerIdForAccount,
} from "@/server/woocommerce/orders";

type PageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "orders" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function OrdersPage({ params }: PageProps) {
  const { locale } = await params;
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect(`/${locale}/login?callbackUrl=/${locale}/orders`);
  }

  const customerId = await resolveWooCustomerIdForAccount({
    wpUserId: session.user.wpUserId,
    email: session.user.email,
  });

  if (customerId == null) {
    return (
      <OrdersPageContent
        rows={[]}
        showEmpty={false}
        showNoCustomer
        showNoCredentials={false}
        showError={false}
      />
    );
  }

  const result = await listOrdersForSignedInAccount(customerId, session.user.email);

  if (!result.ok && result.code === "no_credentials") {
    return (
      <OrdersPageContent
        rows={[]}
        showEmpty={false}
        showNoCustomer={false}
        showNoCredentials
        showError={false}
      />
    );
  }

  if (!result.ok) {
    return (
      <OrdersPageContent
        rows={[]}
        showEmpty={false}
        showNoCustomer={false}
        showNoCredentials={false}
        showError
      />
    );
  }

  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const rows = result.orders.map((o) => ({
    id: o.id,
    number: o.number,
    status: o.status,
    dateLabel: (() => {
      const d = new Date(o.date_created);
      return Number.isNaN(d.getTime()) ? o.date_created : dateFmt.format(d);
    })(),
    totalLabel: formatWooOrderTotalDecimal(o.total, o.currency, locale),
    storefrontOrderPath: `/o/${o.id}`,
    detailUrl: wooOrderReceivedUrl(o.id, o.order_key),
  }));

  const showEmpty = rows.length === 0;

  return (
    <OrdersPageContent
      rows={rows}
      showEmpty={showEmpty}
      showNoCustomer={false}
      showNoCredentials={false}
      showError={false}
    />
  );
}
