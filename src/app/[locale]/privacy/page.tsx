import { Box, Heading, Stack, Table, Text } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

const COOKIE_ROW_KEYS = [
  "cartToken",
  "storeNonce",
  "sessionToken",
  "taxonomyPreview",
  "consentPrefs",
] as const;

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function PrivacyPage({ params }: Props) {
  await params;
  const t = await getTranslations("privacy");

  return (
    <Stack gap={10} maxW="3xl">
      <Box>
        <Heading as="h1" size="2xl" color="gray.900" mb={4}>
          {t("title")}
        </Heading>
        <Text fontSize="sm" color="gray.600" fontStyle="italic" mb={6}>
          {t("notLegalAdvice")}
        </Text>
        <Stack gap={4}>
          <Text color="gray.700">{t("intro")}</Text>
        </Stack>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("controllerTitle")}
        </Heading>
        <Text color="gray.700">{t("controllerBody")}</Text>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("purposesTitle")}
        </Heading>
        <Text color="gray.700">{t("purposesBody")}</Text>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("cookiesTitle")}
        </Heading>
        <Text color="gray.700" mb={4}>
          {t("cookiesIntro")}
        </Text>
        <Table.ScrollArea borderWidth="1px" borderRadius="md" borderColor="gray.200">
          <Table.Root size="sm" variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t("cookieTableName")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("cookieTablePurpose")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("cookieTableDuration")}</Table.ColumnHeader>
                <Table.ColumnHeader>{t("cookieTableType")}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {COOKIE_ROW_KEYS.map((key) => (
                <Table.Row key={key}>
                  <Table.Cell fontWeight="medium" whiteSpace="nowrap">
                    {t(`cookieRows.${key}.name`)}
                  </Table.Cell>
                  <Table.Cell>{t(`cookieRows.${key}.purpose`)}</Table.Cell>
                  <Table.Cell whiteSpace="nowrap">{t(`cookieRows.${key}.duration`)}</Table.Cell>
                  <Table.Cell>{t(`cookieRows.${key}.type`)}</Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </Table.ScrollArea>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("checkoutTitle")}
        </Heading>
        <Text color="gray.700">{t("checkoutBody")}</Text>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("googleTitle")}
        </Heading>
        <Text color="gray.700">{t("googleBody")}</Text>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("rightsTitle")}
        </Heading>
        <Text color="gray.700">{t("rightsBody")}</Text>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("withdrawTitle")}
        </Heading>
        <Text color="gray.700">{t("withdrawBody")}</Text>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={3}>
          {t("updatesTitle")}
        </Heading>
        <Text color="gray.700">{t("updatesBody")}</Text>
      </Box>
    </Stack>
  );
}
