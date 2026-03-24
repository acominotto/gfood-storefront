import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { env } from "@/lib/env";
import {
  defaultTitle,
  description,
  opengraphImageAlt,
  opengraphImageSize,
  siteName,
} from "@/lib/site-metadata";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-heading",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(env.NEXT_PUBLIC_APP_URL),
  icons: {
    icon: [{ url: "/favicon.png", sizes: "50x50", type: "image/png" }],
    shortcut: "/favicon.png",
  },
  title: {
    default: defaultTitle,
    template: `%s | ${siteName}`,
  },
  description,
  applicationName: siteName,
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
    images: [
      {
        url: "/opengraph-image",
        width: opengraphImageSize.width,
        height: opengraphImageSize.height,
        alt: opengraphImageAlt,
      },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={montserrat.variable}>
      <body>{children}</body>
    </html>
  );
}
