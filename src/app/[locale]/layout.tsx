import { Box, Container, Flex } from "@chakra-ui/react";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { AppFooter } from "@/components/app-footer";
import { AppProviders } from "@/components/providers";
import { TopNav } from "@/components/top-nav";
import { routing } from "@/i18n/routing";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <AppProviders>
        <Flex direction="column" minH="100vh">
          <TopNav />
          <Box as="main" flex="1" display="flex" flexDirection="column" minW={0}>
            <Container
              maxW="7xl"
              py={{ base: 5, md: 10 }}
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
        </Flex>
      </AppProviders>
    </NextIntlClientProvider>
  );
}
