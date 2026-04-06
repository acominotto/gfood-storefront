"use client";

import { Link } from "@/components/ui/link";
import { Card, Link as ChakraLink, Stack, Table, Text } from "@chakra-ui/react";
import { useTranslations } from "next-intl";

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

export type OrderHistoryRow = {
  id: number;
  number: string;
  status: string;
  dateLabel: string;
  totalLabel: string;
  storefrontOrderPath: string;
  detailUrl: string | null;
};

function OrderStatusText({ status }: { status: string }) {
  const t = useTranslations("orders");
  if (KNOWN_STATUSES.has(status)) {
    return <>{t(`status.${status}` as "status.pending")}</>;
  }
  return <>{status}</>;
}

export function OrdersPageContent({
  rows,
  showEmpty,
  showNoCredentials,
  showNoCustomer,
  showError,
}: {
  rows: OrderHistoryRow[];
  showEmpty: boolean;
  showNoCredentials: boolean;
  showNoCustomer: boolean;
  showError: boolean;
}) {
  const t = useTranslations("orders");
  const tNav = useTranslations("nav");

  return (
    <Stack gap={6} py={2}>
      <Stack gap={1}>
        <Text fontSize="2xl" fontWeight="bold">
          {t("title")}
        </Text>
        <Text color="fg.muted" fontSize="sm">
          {t("intro")}
        </Text>
      </Stack>

      {showNoCustomer ? (
        <Text color="fg.muted">{t("noCustomer")}</Text>
      ) : null}

      {showNoCredentials ? (
        <Text color="fg.muted">{t("unavailableCredentials")}</Text>
      ) : null}

      {showError ? (
        <Text color="red.600">{t("loadError")}</Text>
      ) : null}

      {showEmpty && !showNoCustomer && !showNoCredentials && !showError ? (
        <Card.Root>
          <Card.Body>
            <Stack gap={2}>
              <Text fontWeight="semibold">{t("emptyTitle")}</Text>
              <Text color="fg.muted" fontSize="sm">
                {t("emptyHint")}
              </Text>
              <Link href="/" fontWeight="medium">
                {tNav("catalog")}
              </Link>
            </Stack>
          </Card.Body>
        </Card.Root>
      ) : null}

      {rows.length > 0 ? (
        <Card.Root overflowX="auto">
          <Card.Body p={0}>
            <Table.Root size="sm" variant="line">
              <Table.Header>
                <Table.Row>
                  <Table.ColumnHeader>{t("colOrder")}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t("colDate")}</Table.ColumnHeader>
                  <Table.ColumnHeader>{t("colStatus")}</Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">
                    {t("colTotal")}
                  </Table.ColumnHeader>
                  <Table.ColumnHeader textAlign="end">{t("colDetails")}</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {rows.map((row) => (
                  <Table.Row key={row.id}>
                    <Table.Cell fontWeight="medium">
                      <Link href={row.storefrontOrderPath ?? `/o/${row.id}`}>#{row.number}</Link>
                    </Table.Cell>
                    <Table.Cell>{row.dateLabel}</Table.Cell>
                    <Table.Cell>
                      <OrderStatusText status={row.status} />
                    </Table.Cell>
                    <Table.Cell textAlign="end">{row.totalLabel}</Table.Cell>
                    <Table.Cell textAlign="end">
                      <Stack gap={1} alignItems="flex-end">
                        <Link href={row.storefrontOrderPath ?? `/o/${row.id}`} fontWeight="medium" fontSize="sm">
                          {t("colViewOrder")}
                        </Link>
                        {row.detailUrl ? (
                          <ChakraLink
                            href={row.detailUrl}
                            fontWeight="medium"
                            fontSize="sm"
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            {t("viewOnSite")}
                          </ChakraLink>
                        ) : null}
                      </Stack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          </Card.Body>
        </Card.Root>
      ) : null}
    </Stack>
  );
}
