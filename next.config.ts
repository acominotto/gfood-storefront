import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Keep native addons out of the Turbopack bundle so `onnxruntime-node` loads
  // `libonnxruntime.so.*` from `node_modules/onnxruntime-node/bin/...` (Vercel
  // otherwise traced only the `.node` file and failed at runtime).
  serverExternalPackages: ["onnxruntime-node", "@imgly/background-removal-node"],
  // Only Linux x64 (Vercel's default Node runtime). `bin/**/*` adds ~130MB of other OS/arch.
  outputFileTracingIncludes: {
    "/app/api/images/**/*": [
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*",
      "./node_modules/@imgly/background-removal-node/dist/**/*",
    ],
  },
  outputFileTracingExcludes: {
    "/app/api/images/**/*": [
      "./node_modules/onnxruntime-node/bin/napi-v3/darwin/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v3/win32/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/**/*",
    ],
  },
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
