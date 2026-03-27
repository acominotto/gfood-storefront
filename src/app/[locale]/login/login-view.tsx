"use client";

import { Button } from "@/components/ui/button";
import {
  Box,
  Card,
  HStack,
  IconButton,
  Input,
  Link as ChakraLink,
  Stack,
  Text,
} from "@chakra-ui/react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useState } from "react";
import { FcGoogle } from "react-icons/fc";
import { MdVisibility, MdVisibilityOff } from "react-icons/md";
import { NextIntlLink } from "@/i18n/navigation";

type Props = {
  returnTo: string;
  lostPasswordUrl: string;
  registerUrl: string;
};

export function LoginView({ returnTo, lostPasswordUrl, registerUrl }: Props) {
  const t = useTranslations("auth");
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function signInWithCredentials() {
    setError(null);
    try {
      const res = await signIn("credentials", {
        email: identifier,
        password,
        redirect: false,
        callbackUrl: returnTo,
      });
      if (res?.error) {
        setError(t("invalidCredentials"));
        return;
      }
      if (res?.ok) {
        router.push(res.url ?? returnTo);
        router.refresh();
        return;
      }
      setError(t("signInError"));
    } catch {
      setError(t("signInError"));
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
          {t("title")}
        </Text>
        <Text fontSize="sm" color="fg.muted" maxW="sm">
          {t("subtitle")}
        </Text>
        <Text fontSize="xs" color="fg.muted" maxW="sm">
          {t("wpHelp")}
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
                if (target.tagName === "BUTTON") {
                  if (target.hasAttribute("data-login-submit")) return;
                  return;
                }
                const form = e.currentTarget;
                if (!form.checkValidity()) {
                  form.reportValidity();
                  return;
                }
                e.preventDefault();
                void signInWithCredentials();
              }}
            >
              <Stack gap={4}>
                <Stack gap={1.5}>
                  <Text fontSize="sm" fontWeight="medium">
                    {t("emailOrUsername")}
                  </Text>
                  <Input
                    type="text"
                    name="identifier"
                    autoComplete="username"
                    value={identifier}
                    onChange={(ev) => setIdentifier(ev.target.value)}
                    required
                    aria-label={t("emailOrUsername")}
                  />
                </Stack>
                <Stack gap={1.5}>
                  <HStack justify="space-between" align="baseline">
                    <Text fontSize="sm" fontWeight="medium">
                      {t("password")}
                    </Text>
                    <ChakraLink
                      href={lostPasswordUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      fontSize="xs"
                      color="brand.fg"
                      textDecoration="underline"
                    >
                      {t("forgotPassword")}
                    </ChakraLink>
                  </HStack>
                  <HStack gap={1}>
                    <Input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(ev) => setPassword(ev.target.value)}
                      required
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
                {error ? (
                  <Text fontSize="sm" color="red.600" role="alert">
                    {error}
                  </Text>
                ) : null}
                <Button
                  type="button"
                  data-login-submit=""
                  onClick={() => signInWithCredentials()}
                  colorPalette="brand"
                  size="lg"
                >
                  {t("signIn")}
                </Button>
              </Stack>
            </form>

            <HStack gap={3} align="center">
              <Box flex={1} h="1px" bg="border.subtle" />
              <Text fontSize="sm" color="fg.muted" whiteSpace="nowrap">
                {t("orDivider")}
              </Text>
              <Box flex={1} h="1px" bg="border.subtle" />
            </HStack>

            <Button
              type="button"
              variant="outline"
              width="full"
              size="lg"
              onClick={() => signIn("google", { callbackUrl: returnTo })}
              borderColor="gray.200"
              bg="white"
              _hover={{ bg: "gray.50" }}
              _dark={{ borderColor: "gray.600", bg: "gray.900", _hover: { bg: "gray.800" } }}
            >
              <HStack gap={3} justify="center" width="full">
                <FcGoogle size={22} aria-hidden />
                <Text fontWeight="medium">{t("google")}</Text>
              </HStack>
            </Button>

            <Stack gap={2} pt={1} align="center">
              <Text fontSize="sm" color="fg.muted" textAlign="center">
                {t("noAccount")}{" "}
                <ChakraLink
                  href={registerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  color="brand.fg"
                  fontWeight="medium"
                  textDecoration="underline"
                >
                  {t("createAccount")}
                </ChakraLink>
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
