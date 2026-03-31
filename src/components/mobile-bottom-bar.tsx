"use client";

import { DeliveryInfoDialogControlled } from "@/components/delivery-info-dialog";
import { NavCartButton } from "@/components/nav-cart-button";
import { Button } from "@/components/ui/button";
import { Drawer } from "@/components/ui/drawer";
import { Link } from "@/components/ui/link";
import { LOCALE_NAV_META } from "@/lib/locale-nav-meta";
import { usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Box, Flex, HStack, IconButton, Image, Separator, Stack, Text } from "@chakra-ui/react";
import { signOut, useSession } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { useState } from "react";
import { LuCheck, LuMenu } from "react-icons/lu";

export function MobileBottomBar() {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const tAuth = useTranslations("auth");
  const { data: session } = useSession();
  const locale = useLocale();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  return (
    <>
      <Flex
        display={{ base: "flex", md: "none" }}
        position="fixed"
        left={0}
        right={0}
        bottom={0}
        zIndex={950}
        bg="brand.50"
        borderTopWidth="1px"
        borderColor="gray.200"
        px={4}
        py={2}
        pb="calc(0.5rem + env(safe-area-inset-bottom, 0px))"
        justify="space-between"
        align="center"
        gap={4}
        shadow="0 -4px 12px rgba(0,0,0,0.06)"
      >
        <NavCartButton compact />
        <IconButton
          type="button"
          variant="outline"
          colorPalette="brand"
          bg="white"
          size="md"
          rounded="lg"
          flexShrink={0}
          aria-label={tNav("siteMenu")}
          aria-haspopup="dialog"
          onClick={() => setMenuOpen(true)}
        >
          <LuMenu size={22} />
        </IconButton>
      </Flex>

      <Drawer.Root open={menuOpen} onOpenChange={(e) => setMenuOpen(e.open)} placement="bottom">
        <Drawer.Content roundedTop="2xl" maxH="85dvh">
          <Drawer.Header borderBottomWidth="1px" borderColor="gray.200" position="relative" py={4}>
            <Drawer.CloseTrigger aria-label={tNav("closeDrawer")} />
            <Drawer.Title fontWeight="semibold">{tNav("siteMenu")}</Drawer.Title>
          </Drawer.Header>
          <Drawer.Body py={4}>
            <Stack gap={1} align="stretch">
              <Button asChild variant="ghost" justifyContent="flex-start" size="lg" fontWeight="normal">
                <Link href="/impressum" onClick={() => setMenuOpen(false)}>
                  {tFooter("impressum")}
                </Link>
              </Button>

              <Separator />

              {!session ? (
                <Button asChild variant="ghost" justifyContent="flex-start" size="lg" fontWeight="normal">
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    {tNav("login")}
                  </Link>
                </Button>
              ) : (
                <>
                  {session.user?.email ? (
                    <Text fontSize="sm" color="gray.600" px={3} py={1}>
                      {session.user.email}
                    </Text>
                  ) : null}
                  <Button
                    variant="ghost"
                    justifyContent="flex-start"
                    size="lg"
                    fontWeight="normal"
                    onClick={() => {
                      setMenuOpen(false);
                      void signOut({ callbackUrl: `/${locale}/login` });
                    }}
                  >
                    {tAuth("logout")}
                  </Button>
                </>
              )}

              <Separator />

              <Text fontSize="xs" color="gray.500" px={3} pt={2} fontWeight="medium">
                {tNav("language")}
              </Text>
              <Stack gap={0}>
                {routing.locales.map((loc) => {
                  const meta = LOCALE_NAV_META[loc];
                  return (
                    <Button key={loc} asChild variant="ghost" justifyContent="flex-start" size="lg" fontWeight="normal">
                      <Link href={pathname} locale={loc} onClick={() => setMenuOpen(false)}>
                        <HStack gap={3} flex="1" py={0.5} w="full">
                          <Image
                            src={meta.flagSrc}
                            alt=""
                            title={tNav(meta.labelKey)}
                            w="22px"
                            h="15px"
                            objectFit="cover"
                            borderRadius="sm"
                            borderWidth="1px"
                            borderColor="gray.200"
                            flexShrink={0}
                          />
                          <Text flex="1" textAlign="start">
                            {tNav(meta.labelKey)}
                          </Text>
                          {locale === loc ? <LuCheck size={18} /> : <Box w="18px" />}
                        </HStack>
                      </Link>
                    </Button>
                  );
                })}
              </Stack>

              <Separator />

              <Button
                variant="ghost"
                justifyContent="flex-start"
                size="lg"
                fontWeight="normal"
                onClick={() => {
                  setMenuOpen(false);
                  queueMicrotask(() => setDeliveryOpen(true));
                }}
              >
                {tNav("delivery")}
              </Button>
            </Stack>
          </Drawer.Body>
        </Drawer.Content>
      </Drawer.Root>

      <DeliveryInfoDialogControlled open={deliveryOpen} onOpenChange={setDeliveryOpen} />
    </>
  );
}
