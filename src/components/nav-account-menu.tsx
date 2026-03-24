"use client";

import {
  MenuContent,
  MenuItem,
  MenuRoot,
  MenuTrigger,
  MenuTriggerItem,
} from "@/components/ui/menu";
import { Button } from "@/components/ui/button";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Box, HStack, Image, Text } from "@chakra-ui/react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { FiUser } from "react-icons/fi";
import { LuCheck } from "react-icons/lu";
import { Link } from "./ui/link";

const LOCALE_META: Record<
  (typeof routing.locales)[number],
  { labelKey: "localeFrench" | "localeEnglish" | "localeGerman" | "localeItalian"; flagSrc: string }
> = {
  fr: {
    labelKey: "localeFrench",
    flagSrc: "https://flagcdn.com/w40/fr.png",
  },
  en: {
    labelKey: "localeEnglish",
    flagSrc: "https://flagcdn.com/w40/gb.png",
  },
  de: {
    labelKey: "localeGerman",
    flagSrc: "https://flagcdn.com/w40/de.png",
  },
  it: {
    labelKey: "localeItalian",
    flagSrc: "https://flagcdn.com/w40/it.png",
  },
};

export function NavAccountMenu() {
  const t = useTranslations("nav");
  const tAuth = useTranslations("auth");
  const { data: session } = useSession();
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <MenuRoot>
      <MenuTrigger asChild>
        <Button size="sm" colorPalette="brand" aria-haspopup="menu">
          <FiUser />
          {t("myAccount")}
        </Button>
      </MenuTrigger>
      <MenuContent minW="12rem">
        {session?.user?.email ? (
          <Box px={2} py={1.5} borderBottomWidth="1px" borderColor="gray.100">
            <Text fontSize="xs" color="gray.500" lineClamp={1}>
              {session.user.email}
            </Text>
          </Box>
        ) : null}

        {!session ? (
          <MenuItem value="login" asChild>
            <Link href="/login">{t("login")}</Link>
          </MenuItem>
        ) : null}

        <MenuRoot positioning={{ placement: "right-start", gutter: 2 }}>
          <MenuTriggerItem value="language">{t("language")}</MenuTriggerItem>
          <MenuContent minW="11rem">
            {routing.locales.map((loc) => {
              const meta = LOCALE_META[loc];
              return (
                <MenuItem key={loc} value={loc} asChild>
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
                </MenuItem>
              );
            })}
          </MenuContent>
        </MenuRoot>

        {session ? (
          <MenuItem value="logout" onClick={() => signOut({ callbackUrl: `/${locale}/login` })}>
            {tAuth("logout")}
          </MenuItem>
        ) : null}
      </MenuContent>
    </MenuRoot>
  );
}
