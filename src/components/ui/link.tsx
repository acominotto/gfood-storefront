import { NextIntlLink } from "@/i18n/navigation";
import { Link as ChakraLink, type LinkProps as ChakraLinkProps } from "@chakra-ui/react";

export type LinkProps = ChakraLinkProps & {
    locale?: string;
};

export function Link({ children, ...props }: LinkProps) {
    return <ChakraLink asChild {...props}>
        <NextIntlLink href={props.href as string} locale={props.locale}>{children}</NextIntlLink>
    </ChakraLink>;
}