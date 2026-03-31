/** Shim so editors resolve `next-intl/plugin` (package exports + `moduleResolution: "bundler"`). Runtime still loads the real package from node_modules. */
declare module "next-intl/plugin" {
  import type { NextConfig } from "next";

  export default function createNextIntlPlugin(
    i18nPathOrConfig?: string | Record<string, unknown>,
  ): (nextConfig?: NextConfig) => NextConfig;
}
