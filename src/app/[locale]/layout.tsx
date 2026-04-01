import { Box, Container, Flex } from "@chakra-ui/react";
import type { Metadata } from "next";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppFooter } from "@/components/app-footer";
import { MobileBottomBar } from "@/components/mobile-bottom-bar";
import { AppProviders } from "@/components/providers";
import { TopNav } from "@/components/top-nav";
import { routing } from "@/i18n/routing";
import { MOBILE_MAIN_PADDING_BOTTOM } from "@/lib/mobile-bottom-chrome";
import { openGraphForLocale } from "@/lib/site-metadata";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({
  params,
}: Props): Promise<Metadata> {
  const { locale } = await params;
  return {
    openGraph: openGraphForLocale(locale),
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <AppProviders>
        <Flex direction="column" minH="100vh">
          <TopNav />
          <Box as="main" flex="1" display="flex" flexDirection="column" minW={0}>
            <Container
              maxW="min(100%, 120rem)"
              pt={{ base: 5, md: 10 }}
              pb={{
                base: MOBILE_MAIN_PADDING_BOTTOM,
                md: 10,
              }}
              px={{ base: 3, sm: 4, md: 8 }}
              flex="1"
              display="flex"
              flexDirection="column"
              minW={0}
            >
              <Box flex="1" minW={0} maxW="100%">
                {children}
              </Box>
            </Container>
          </Box>
          <AppFooter />
          <MobileBottomBar />
        </Flex>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
