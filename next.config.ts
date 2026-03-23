import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  images: {
    remotePatterns: [],
  },
};

const withNextIntl = createNextIntlPlugin();

export default withNextIntl(nextConfig);
