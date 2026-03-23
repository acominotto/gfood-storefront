import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "G-Food Storefront",
  description: "Headless storefront powered by WordPress and WooCommerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
