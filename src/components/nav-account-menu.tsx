"use client";

import { Menu } from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { LOCALE_NAV_META } from "@/lib/locale-nav-meta";
import { Box, HStack, Image, Text } from "@chakra-ui/react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { FiUser } from "react-icons/fi";
import { LuCheck } from "react-icons/lu";
import { useEffect, useRef, useState } from "react";
import { Link } from "./ui/link";

const LANG_MENU_CLOSE_MS = 180;

export function NavAccountMenu() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { data: session } = useSession();
  const locale = useLocale();
  const pathname = usePathname();

  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const langCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearLangCloseTimer() {
    if (langCloseTimer.current != null) {
      clearTimeout(langCloseTimer.current);
      langCloseTimer.current = null;
    }
  }

  function openLangMenu() {
    clearLangCloseTimer();
    setLangMenuOpen(true);
  }

  function scheduleLangMenuClose() {
    clearLangCloseTimer();
    langCloseTimer.current = setTimeout(() => setLangMenuOpen(false), LANG_MENU_CLOSE_MS);
  }

  useEffect(() => () => clearLangCloseTimer(), []);

  return (
    <Menu.Root
      positioning={{
        placement: "bottom-end",
        gutter: 2,
        offset: { mainAxis: -8 },
        strategy: "fixed",
      }}
      onOpenChange={(d) => {
        if (!d.open) {
          clearLangCloseTimer();
          setLangMenuOpen(false);
        }
      }}
    >
      <Menu.Trigger asChild>
        <Button size="sm" colorPalette="brand" aria-haspopup="menu">
          <FiUser />
          {t("myAccount")}
        </Button>
      </Menu.Trigger>
      <Menu.Content minW="12rem">
        {session?.user?.email ? (
          <Box px={2} py={1.5} borderBottomWidth="1px" borderColor="gray.100">
            <Text fontSize="xs" color="gray.500" lineClamp={1}>
              {session.user.email}
            </Text>
          </Box>
        ) : null}

        {!session ? (
          <>
            <Menu.Item value="login" asChild>
              <Link href="/login">{t("login")}</Link>
            </Menu.Item>
            <Menu.Item value="register" asChild>
              <Link href="/register">{t("register")}</Link>
            </Menu.Item>
          </>
        ) : null}

        <Menu.Root
          open={langMenuOpen}
          onOpenChange={(d) => {
            setLangMenuOpen(d.open);
            if (d.open) clearLangCloseTimer();
          }}
          positioning={{
            placement: "right-start",
            gutter: 4,
            offset: { crossAxis: -6 },
            strategy: "fixed",
          }}
        >
          <Menu.TriggerItem
            value="language"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") {
                openLangMenu();
              }
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") {
                scheduleLangMenuClose();
              }
            }}
          >
            {t("language")}
          </Menu.TriggerItem>
          <Menu.Content
            minW="11rem"
            onPointerEnter={(e) => {
              if (e.pointerType === "mouse") {
                openLangMenu();
              }
            }}
            onPointerLeave={(e) => {
              if (e.pointerType === "mouse") {
                scheduleLangMenuClose();
              }
            }}
          >
            {routing.locales.map((loc) => {
              const meta = LOCALE_NAV_META[loc];
              return (
                <Menu.Item key={loc} value={loc} asChild>
                  <Link href={pathname} locale={loc}>
                    <HStack gap={2} flex="1" py={0.5}>
                      <Image
                        src={meta.flagSrc}
                        alt=""
                        title={t(meta.labelKey)}
                        w="22px"
                        h="15px"
                        objectFit="cover"
                        borderRadius="sm"
                        borderWidth="1px"
                        borderColor="gray.200"
                        flexShrink={0}
                      />
                      <Text flex="1">{t(meta.labelKey)}</Text>
                      {locale === loc ? <LuCheck size={16} /> : <Box w="16px" />}
                    </HStack>
                  </Link>
                </Menu.Item>
              );
            })}
          </Menu.Content>
        </Menu.Root>

        {session ? (
          <Menu.Item value="logout" onClick={() => signOut({ callbackUrl: `/${locale}/login` })}>
            {tAuth("logout")}
          </Menu.Item>
        ) : null}
      </Menu.Content>
    </Menu.Root>
  );
}
