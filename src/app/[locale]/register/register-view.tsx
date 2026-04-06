"use client";

import { Button } from "@/components/ui/button";
import { Box, Card, HStack, IconButton, Input, Stack, Text } from "@chakra-ui/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { NextIntlLink } from "@/i18n/navigation";

type Props = {
  returnTo: string;
};

export function RegisterView({ returnTo }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onRegister() {
    setError(null);
    if (password !== confirmPassword) {
      setError(t("registerPasswordMismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          ...(name.trim() ? { name: name.trim() } : {}),
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (res.status === 409 || data.error === "EMAIL_EXISTS") {
        setError(t("registerErrorEmailExists"));
        return;
      }
      if (!res.ok) {
        if (res.status === 503 || data.error === "BACKEND_AUTH" || data.error === "WP_SYNC_AUTH") {
          setError(t("registerErrorWpSync"));
          return;
        }
        if (res.status === 403 || data.error === "FORBIDDEN") {
          setError(t("securityOriginRejected"));
          return;
        }
        if (data.error === "RATE_LIMIT") {
          setError(t("registerErrorRateLimit"));
          return;
        }
        if (data.error === "INVALID_REQUEST") {
          setError(t("registerErrorValidation"));
          return;
        }
        setError(t("registerErrorGeneric"));
        return;
      }

      const sign = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
        callbackUrl: returnTo,
      });
      if (sign?.error) {
        setError(t("registerErrorSignInAfter"));
        return;
      }
      if (sign?.ok) {
        router.push(sign.url ?? returnTo);
        router.refresh();
      }
    } catch {
      setError(t("registerErrorGeneric"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Stack gap={8} align="center" w="full" maxW="md" mx="auto">
      <Stack gap={2} align="center" textAlign="center">
        <Box position="relative" w={{ base: "9rem", md: "11rem" }} h={{ base: "2.75rem", md: "3.25rem" }}>
          <Image
            src="/gashi-logo.png"
            alt={t("logoAlt")}
            fill
            sizes="(max-width: 768px) 9rem, 11rem"
            style={{ objectFit: "contain" }}
            priority
          />
        </Box>
        <Text fontSize="2xl" fontWeight="bold" fontFamily="heading">
          {t("registerTitle")}
        </Text>
        <Text fontSize="sm" color="fg.muted" maxW="sm">
          {t("registerSubtitle")}
        </Text>
      </Stack>

      <Card.Root w="full" boxShadow="md">
        <Card.Body>
          <Stack gap={5}>
            <form
              onSubmit={(e) => e.preventDefault()}
              onKeyDown={(e) => {
                if (e.key !== "Enter") return;
                const target = e.target as HTMLElement;
                if (target.tagName === "BUTTON" && !target.hasAttribute("data-register-submit")) {
                  return;
                }
                const form = e.currentTarget;
                if (!form.checkValidity()) {
                  form.reportValidity();
                  return;
                }
                e.preventDefault();
                void onRegister();
              }}
            >
              <Stack gap={4}>
                <Stack gap={1.5}>
                  <Text fontSize="sm" fontWeight="medium">
                    {t("registerEmail")}
                  </Text>
                  <Input
                    type="email"
                    name="email"
                    autoComplete="email"
                    value={email}
                    onChange={(ev) => setEmail(ev.target.value)}
                    required
                    aria-label={t("registerEmail")}
                  />
                </Stack>
                <Stack gap={1.5}>
                  <Text fontSize="sm" fontWeight="medium">
                    {t("registerNameOptional")}
                  </Text>
                  <Input
                    type="text"
                    name="name"
                    autoComplete="name"
                    value={name}
                    onChange={(ev) => setName(ev.target.value)}
                    aria-label={t("registerNameOptional")}
                  />
                </Stack>
                <Stack gap={1.5}>
                  <Text fontSize="sm" fontWeight="medium">
                    {t("password")}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {t("registerPasswordHint")}
                  </Text>
                  <HStack gap={1}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="new-password"
                      value={password}
                      onChange={(ev) => setPassword(ev.target.value)}
                      required
                      minLength={8}
                      flex="1"
                      aria-label={t("password")}
                    />
                    <IconButton
                      type="button"
                      variant="ghost"
                      aria-label={showPassword ? t("hidePassword") : t("showPassword")}
                      onClick={() => setShowPassword((v) => !v)}
                    >
                      {showPassword ? <MdVisibilityOff size={20} /> : <MdVisibility size={20} />}
                    </IconButton>
                  </HStack>
                </Stack>
                <Stack gap={1.5}>
                  <Text fontSize="sm" fontWeight="medium">
                    {t("registerConfirmPassword")}
                  </Text>
                  <Input
                    type={showPassword ? "text" : "password"}
                    name="confirmPassword"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(ev) => setConfirmPassword(ev.target.value)}
                    required
                    minLength={8}
                    aria-label={t("registerConfirmPassword")}
                  />
                </Stack>
                {error ? (
                  <Text fontSize="sm" color="red.600" role="alert">
                    {error}
                  </Text>
                ) : null}
                <Button
                  type="button"
                  data-register-submit=""
                  onClick={() => void onRegister()}
                  colorPalette="brand"
                  size="lg"
                  loading={loading}
                >
                  {t("registerSubmit")}
                </Button>
              </Stack>
            </form>

            <Stack gap={2} pt={1} align="center">
              <Text fontSize="sm" color="fg.muted" textAlign="center">
                {t("registerHaveAccount")}{" "}
                <NextIntlLink href={{ pathname: "/login", query: { callbackUrl: returnTo } }}>
                  <Text as="span" color="brand.fg" fontWeight="medium" textDecoration="underline">
                    {t("signIn")}
                  </Text>
                </NextIntlLink>
              </Text>
              <NextIntlLink href="/">
                <Text as="span" fontSize="sm" color="fg.muted" textDecoration="underline">
                  {t("backToShop")}
                </Text>
              </NextIntlLink>
            </Stack>
          </Stack>
        </Card.Body>
      </Card.Root>
    </Stack>
  );
}
