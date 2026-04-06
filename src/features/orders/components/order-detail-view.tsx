import { Link } from "@/components/ui/link";
import { env } from "@/lib/env";
import { formatWooOrderTotalDecimal } from "@/lib/format-woo-order-total";
import type { StorefrontOrderDetail } from "@/server/woocommerce/order-detail";
import {
  Box,
  Card,
  HStack,
  Image,
  Link as ChakraLink,
  Stack,
  Table,
  Text,
} from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

const KNOWN_STATUSES = new Set([
  "pending",
  "processing",
  "on-hold",
  "completed",
  "cancelled",
  "refunded",
  "failed",
  "draft",
]);

function formatAddressBlock(
  a: NonNullable<StorefrontOrderDetail["billing"]> | NonNullable<StorefrontOrderDetail["shipping"]>,
): string[] {
  const lines: string[] = [];
  const name = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
  if (name) {
    lines.push(name);
  }
  if (a.company?.trim()) {
    lines.push(a.company.trim());
  }
  const street = [a.address_1, a.address_2].filter(Boolean).join(", ").trim();
  if (street) {
    lines.push(street);
  }
  const cityLine = [a.postcode, a.city].filter(Boolean).join(" ").trim();
  const region = [cityLine, a.state].filter(Boolean).join(", ").trim();
  if (region) {
    lines.push(region);
  }
  if (a.country?.trim()) {
    lines.push(a.country.trim());
  }
  if ("email" in a && a.email?.trim()) {
    lines.push(a.email.trim());
  }
  if ("phone" in a && a.phone?.trim()) {
    lines.push(a.phone.trim());
  }
  return lines;
}

function orderLineThumbProxyUrl(wooSrc: string): string | null {
  try {
    const path = new URL(wooSrc.trim(), "https://g-food.ch").pathname.replace(/^\//, "");
    if (!path) {
      return null;
    }
    return `/api/images/${path}?preset=thumb&q=72&fit=cover&bg=remove&format=webp`;
  } catch {
    return null;
  }
}

function absoluteStorefrontProductUrl(locale: string, path: `/p/${string}`): string {
  const base = env.NEXT_PUBLIC_APP_URL.replace(/\/$/, "");
  return `${base}/${locale}${path}`;
}

async function statusLabel(locale: string, status: string): Promise<string> {
  const t = await getTranslations({ locale, namespace: "orders" });
  if (KNOWN_STATUSES.has(status)) {
    return t(`status.${status}` as "status.pending");
  }
  return status;
}

export async function OrderDetailView({
  locale,
  order,
  showPlacedAck,
  wooDetailUrl,
  showSignedInOrdersLink,
}: {
  locale: string;
  order: StorefrontOrderDetail;
  showPlacedAck: boolean;
  wooDetailUrl: string | null;
  showSignedInOrdersLink: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "orders" });
  const statusText = await statusLabel(locale, order.status);

  const dateFmt = new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const created = new Date(order.date_created);
  const dateLabel = Number.isNaN(created.getTime())
    ? order.date_created
    : dateFmt.format(created);

  const shipNum = Number(order.shipping_total ?? "0");
  const discNum = Number(order.discount_total ?? "0");
  const showShipping = Number.isFinite(shipNum) && shipNum > 0;
  const showDiscount = Number.isFinite(discNum) && discNum > 0;

  const billingLines = order.billing ? formatAddressBlock(order.billing) : [];
  const shippingLines = order.shipping ? formatAddressBlock(order.shipping) : [];

  return (
    <Stack gap={6} py={2} maxW="4xl">
      {showPlacedAck ? (
        <Box rounded="md" borderWidth="1px" borderColor="brand.200" bg="brand.50" px={4} py={3}>
          <Text fontWeight="semibold">{t("detailThankYou")}</Text>
          <Text fontSize="sm" color="fg.muted" mt={1}>
            {t("detailThankYouSub")}
          </Text>
        </Box>
      ) : null}

      <Stack gap={1}>
        <Text fontSize="2xl" fontWeight="bold">
          {t("detailTitle", { number: order.number })}
        </Text>
        <Text color="fg.muted" fontSize="sm">
          {t("detailDate", { date: dateLabel })} · {statusText}
        </Text>
        {order.payment_method_title?.trim() ? (
          <Text color="fg.muted" fontSize="sm">
            {t("detailPayment")}: {order.payment_method_title.trim()}
          </Text>
        ) : null}
      </Stack>

      {wooDetailUrl ? (
        <ChakraLink href={wooDetailUrl} fontWeight="medium" target="_blank" rel="noopener noreferrer">
          {t("viewOnSite")}
        </ChakraLink>
      ) : null}

      <Card.Root>
        <Card.Header>
          <Text fontWeight="semibold">{t("detailItems")}</Text>
        </Card.Header>
        <Card.Body p={0} overflowX="auto">
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t("detailColProduct")}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">{t("detailColQty")}</Table.ColumnHeader>
                <Table.ColumnHeader textAlign="end">{t("detailColLineTotal")}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {order.line_items.map((line, i) => {
                const productHref = line.storefrontProductPath
                  ? absoluteStorefrontProductUrl(locale, line.storefrontProductPath)
                  : null;
                const thumbSrc = line.displayImageSrc ? orderLineThumbProxyUrl(line.displayImageSrc) : null;
                const rowKey = line.id ?? `line-${i}`;
                const thumbImg = thumbSrc ? (
                  <Image
                    src={thumbSrc}
                    alt={line.name}
                    w="56px"
                    h="56px"
                    borderRadius="md"
                    objectFit="cover"
                    flexShrink={0}
                  />
                ) : (
                  <Box w="56px" h="56px" bg="gray.100" borderRadius="md" flexShrink={0} aria-hidden />
                );
                return (
                  <Table.Row key={rowKey}>
                    <Table.Cell>
                      <HStack gap={3} alignItems="flex-start">
                        {productHref ? (
                          <ChakraLink
                            href={productHref}
                            target="_blank"
                            rel="noopener noreferrer"
                            flexShrink={0}
                            lineHeight={0}
                          >
                            {thumbImg}
                          </ChakraLink>
                        ) : (
                          thumbImg
                        )}
                        <Stack gap={0} minW={0}>
                          {productHref ? (
                            <ChakraLink
                              href={productHref}
                              target="_blank"
                              rel="noopener noreferrer"
                              fontWeight="medium"
                              display="block"
                            >
                              {line.name}
                            </ChakraLink>
                          ) : (
                            <Text fontWeight="medium">{line.name}</Text>
                          )}
                          {line.sku?.trim() ? (
                            <Text fontSize="xs" color="fg.muted">
                              {line.sku.trim()}
                            </Text>
                          ) : null}
                        </Stack>
                      </HStack>
                    </Table.Cell>
                    <Table.Cell textAlign="end">{line.quantity}</Table.Cell>
                    <Table.Cell textAlign="end">
                      {formatWooOrderTotalDecimal(line.total, order.currency, locale)}
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        </Card.Body>
      </Card.Root>

      <Stack gap={2} maxW="sm" alignSelf="flex-end">
        {showShipping ? (
          <HRow
            label={t("detailShippingLine")}
            value={formatWooOrderTotalDecimal(order.shipping_total ?? "0", order.currency, locale)}
          />
        ) : null}
        {showDiscount ? (
          <HRow
            label={t("detailDiscount")}
            value={`−${formatWooOrderTotalDecimal(order.discount_total ?? "0", order.currency, locale)}`}
          />
        ) : null}
        <HRow
          label={t("detailOrderTotal")}
          value={formatWooOrderTotalDecimal(order.total, order.currency, locale)}
          strong
        />
      </Stack>

      {order.customer_note?.trim() ? (
        <Box>
          <Text fontWeight="semibold" mb={1}>
            {t("detailNote")}
          </Text>
          <Text fontSize="sm" color="fg.muted" whiteSpace="pre-wrap">
            {order.customer_note.trim()}
          </Text>
        </Box>
      ) : null}

      {(billingLines.length > 0 || shippingLines.length > 0) && (
        <Stack gap={4} direction={{ base: "column", md: "row" }}>
          {billingLines.length > 0 ? (
            <Box flex="1">
              <Text fontWeight="semibold" mb={2}>
                {t("detailBilling")}
              </Text>
              <Stack gap={0}>
                {billingLines.map((line, i) => (
                  <Text key={i} fontSize="sm" color="fg.muted">
                    {line}
                  </Text>
                ))}
              </Stack>
            </Box>
          ) : null}
          {shippingLines.length > 0 ? (
            <Box flex="1">
              <Text fontWeight="semibold" mb={2}>
                {t("detailShipping")}
              </Text>
              <Stack gap={0}>
                {shippingLines.map((line, i) => (
                  <Text key={i} fontSize="sm" color="fg.muted">
                    {line}
                  </Text>
                ))}
              </Stack>
            </Box>
          ) : null}
        </Stack>
      )}

      <Stack gap={2} direction="row" flexWrap="wrap">
        <Link href="/" fontWeight="medium">
          {t("detailBackCatalog")}
        </Link>
        {showSignedInOrdersLink ? (
          <Link href="/orders" fontWeight="medium">
            {t("detailBackOrders")}
          </Link>
        ) : null}
      </Stack>
    </Stack>
  );
}

function HRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Stack direction="row" justify="space-between" gap={4}>
      <Text fontSize="sm" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight={strong ? "semibold" : "medium"}>
        {value}
      </Text>
    </Stack>
  );
}

export async function OrderDetailErrorView({
  locale,
  code,
  showOrdersLink,
}: {
  locale: string;
  code: "no_credentials" | "forbidden" | "parse_error" | "http_error";
  showOrdersLink: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "orders" });

  const message =
    code === "no_credentials"
      ? t("unavailableCredentials")
      : code === "forbidden"
        ? t("detailForbidden")
        : t("detailError");

  return (
    <Stack gap={4} py={8} maxW="lg">
      <Text color={code === "forbidden" ? "fg.muted" : "red.600"}>{message}</Text>
      <Stack gap={2} direction="row" flexWrap="wrap">
        <Link href="/" fontWeight="medium">
          {t("detailBackCatalog")}
        </Link>
        {showOrdersLink ? (
          <Link href="/orders" fontWeight="medium">
            {t("detailBackOrders")}
          </Link>
        ) : null}
      </Stack>
    </Stack>
  );
}
