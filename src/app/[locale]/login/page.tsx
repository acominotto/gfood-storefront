"use client";

import { Button, Card, Stack, Text } from "@chakra-ui/react";
import { useLocale, useTranslations } from "next-intl";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const t = useTranslations("auth");
  const locale = useLocale();

  return (
    <Card.Root maxW="md" mx="auto">
      <Card.Header>
        <Text fontSize="2xl" fontWeight="bold">
          {t("title")}
        </Text>
      </Card.Header>
      <Card.Body>
        <Stack gap={3}>
          <Button onClick={() => signIn("google", { callbackUrl: `/${locale}/commander-en-ligne` })}>
            {t("google")}
          </Button>
        </Stack>
      </Card.Body>
    </Card.Root>
  );
}
