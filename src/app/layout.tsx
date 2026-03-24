import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import { env } from "@/lib/env";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-heading",
  display: "swap",
});

const siteName = "GASHI International Food";
const defaultTitle = "G-Food — GASHI International Food";
const description =
  "International food delivered in Switzerland. Les saveurs d’ailleurs — order online with G-Food.";

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
  openGraph: {
    type: "website",
    locale: "fr_CH",
    alternateLocale: ["en_CH", "de_CH", "it_CH"],
    url: "/fr",
    siteName,
    title: defaultTitle,
    description,
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
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
