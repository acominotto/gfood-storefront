import { Box, Heading, Link, Stack, Text } from "@chakra-ui/react";
import { getTranslations } from "next-intl/server";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "impressum" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ImpressumPage({ params }: Props) {
  await params;
  const t = await getTranslations("impressum");

  return (
    <Stack gap={10} maxW="2xl">
      <Box>
        <Heading as="h1" size="2xl" color="gray.900" mb={6}>
          {t("title")}
        </Heading>
        <Stack gap={2}>
          <Text fontWeight="semibold" fontSize="lg">
            {t("company")}
          </Text>
          <Text>{t("street")}</Text>
          <Text>{t("city")}</Text>
          <Text>
            <Text as="span" color="gray.600">
              {t("websiteLabel")}:{" "}
            </Text>
            <Link
              href={t("websiteUrl")}
              target="_blank"
              rel="noopener noreferrer"
              color="gray.700"
              textDecoration="underline"
            >
              {t("websiteDisplay")}
            </Link>
          </Text>
        </Stack>
      </Box>

      <Box>
        <Heading as="h2" size="lg" color="gray.900" mb={4}>
          {t("contactTitle")}
        </Heading>
        <Stack gap={3}>
          <Text>
            <Text as="span" color="gray.600">
              {t("emailLabel")}:{" "}
            </Text>
            <Link href={`mailto:${t("emailAddress")}`} color="gray.700" textDecoration="underline">
              {t("emailAddress")}
            </Link>
          </Text>
          <Text>
            <Text as="span" color="gray.600">
              {t("phoneLabel")}:{" "}
            </Text>
            <Link href={t("phoneHref")} color="gray.700" textDecoration="underline">
              {t("phoneDisplay")}
            </Link>
          </Text>
          <Text>
            <Text as="span" color="gray.600">
              {t("contactFormLabel")}:{" "}
            </Text>
            <Link
              href={t("contactFormUrl")}
              target="_blank"
              rel="noopener noreferrer"
              color="gray.700"
              textDecoration="underline"
            >
              {t("contactFormUrl")}
            </Link>
          </Text>
          <Text>
            <Text as="span" color="gray.600">
              {t("hoursLabel")}:{" "}
            </Text>
            {t("hours")}
          </Text>
        </Stack>
      </Box>
    </Stack>
  );
}
