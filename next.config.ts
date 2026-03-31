import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "flagcdn.com",
      },
      {
        protocol: "https",
        hostname: "www.g-food.ch",
      },
      {
        protocol: "https",
        hostname: "g-food.ch",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/fr/commander-en-ligne", destination: "/fr", permanent: true },
      { source: "/en/commander-en-ligne", destination: "/en", permanent: true },
      { source: "/de/commander-en-ligne", destination: "/de", permanent: true },
      { source: "/it/commander-en-ligne", destination: "/it", permanent: true },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
