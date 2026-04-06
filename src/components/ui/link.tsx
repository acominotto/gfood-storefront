import { NextIntlLink } from "@/i18n/navigation";
import { Link as ChakraLink, type LinkProps as ChakraLinkProps } from "@chakra-ui/react";
import type { ComponentProps } from "react";

type NextIntlHref = ComponentProps<typeof NextIntlLink>["href"];

export type LinkProps = Omit<ChakraLinkProps, "href"> & {
  href: NextIntlHref;
  locale?: string;
};

export function Link({ children, href, locale, ...props }: LinkProps) {
  return (
    <ChakraLink asChild {...props}>
      <NextIntlLink href={href} locale={locale}>
        {children}
      </NextIntlLink>
    </ChakraLink>
  );
}