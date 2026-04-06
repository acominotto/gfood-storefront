import { OrderDetailErrorView, OrderDetailView } from "@/features/orders/components/order-detail-view";
import { wooOrderReceivedUrl } from "@/lib/woo-order-received-url";
import { authOptions } from "@/server/auth-options";
import { fetchOrderDetailIfAllowed } from "@/server/woocommerce/order-detail";
import { getServerSession } from "next-auth";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

type PageProps = {
  params: Promise<{ locale: string; orderId: string }>;
  searchParams: Promise<{ key?: string; placed?: string }>;
};

function parseOrderId(raw: string): number | null {
  const id = Number.parseInt(raw, 10);
  if (!Number.isFinite(id) || id <= 0) {
    return null;
  }
  return id;
}

export async function generateMetadata({ params, searchParams }: PageProps) {
  const { locale, orderId } = await params;
  const q = await searchParams;
  const t = await getTranslations({ locale, namespace: "orders" });
  const id = parseOrderId(orderId);
  if (id == null) {
    return { title: t("detailMetaTitleUnknown") };
  }
  const session = await getServerSession(authOptions);
  const result = await fetchOrderDetailIfAllowed(id, {
    orderKeyQuery: q.key,
    wpUserId: session?.user?.wpUserId,
    email: session?.user?.email,
  });
  if (result.ok) {
    return { title: t("detailMetaTitle", { number: result.order.number }) };
  }
  return { title: t("detailMetaTitleUnknown") };
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const { locale, orderId } = await params;
  const q = await searchParams;
  const id = parseOrderId(orderId);
  if (id == null) {
    notFound();
  }

  const session = await getServerSession(authOptions);
  const result = await fetchOrderDetailIfAllowed(id, {
    orderKeyQuery: q.key,
    wpUserId: session?.user?.wpUserId,
    email: session?.user?.email,
  });

  if (result.ok) {
    const wooHref = wooOrderReceivedUrl(result.order.id, result.order.order_key);
    return (
      <OrderDetailView
        locale={locale}
        order={result.order}
        showPlacedAck={q.placed === "1"}
        wooDetailUrl={wooHref}
        showSignedInOrdersLink={Boolean(session?.user)}
      />
    );
  }

  if (result.code === "not_found") {
    notFound();
  }

  return (
    <OrderDetailErrorView
      locale={locale}
      code={result.code}
      showOrdersLink={Boolean(session?.user)}
    />
  );
}
