import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { imglyBackgroundRemovalMediumChunkNames } from "./src/lib/imgly-medium-model-assets";
import { imglyBackgroundRemovalSmallChunkNames } from "./src/lib/imgly-small-model-assets";

const imglyDist = "./node_modules/@imgly/background-removal-node/dist";

/** Vercel Node is Linux x64 (glibc). Drop other sharp optional prebuilds from this function's trace. */
const sharpTraceExcludesNonLinuxX64 = [
  "./node_modules/@img/sharp-linux-arm/**/*",
  "./node_modules/@img/sharp-linux-arm64/**/*",
  "./node_modules/@img/sharp-linux-ppc64/**/*",
  "./node_modules/@img/sharp-linux-riscv64/**/*",
  "./node_modules/@img/sharp-linux-s390x/**/*",
  "./node_modules/@img/sharp-linuxmusl-arm64/**/*",
  "./node_modules/@img/sharp-linuxmusl-x64/**/*",
  "./node_modules/@img/sharp-libvips-linux-arm/**/*",
  "./node_modules/@img/sharp-libvips-linux-arm64/**/*",
  "./node_modules/@img/sharp-libvips-linux-ppc64/**/*",
  "./node_modules/@img/sharp-libvips-linux-riscv64/**/*",
  "./node_modules/@img/sharp-libvips-linux-s390x/**/*",
  "./node_modules/@img/sharp-libvips-linuxmusl-arm64/**/*",
  "./node_modules/@img/sharp-libvips-linuxmusl-x64/**/*",
] as const;

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Keep native addons out of the Turbopack bundle so `onnxruntime-node` loads
  // `libonnxruntime.so.*` from `node_modules/onnxruntime-node/bin/...` (Vercel
  // otherwise traced only the `.node` file and failed at runtime).
  serverExternalPackages: ["onnxruntime-node", "@imgly/background-removal-node"],
  // Linux x64 ORT + small model chunks only (below 250 MB unzipped on Vercel). Requires pnpm
  // `node-linker=hoisted` in .npmrc so paths are not duplicated under .pnpm/*.
  outputFileTracingIncludes: {
    "/app/api/images/**/*": [
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*",
      `${imglyDist}/resources.json`,
      ...imglyBackgroundRemovalSmallChunkNames.map((name) => `${imglyDist}/${name}`),
    ],
  },
  outputFileTracingExcludes: {
    "/app/api/images/**/*": [
      "./node_modules/onnxruntime-node/bin/napi-v3/darwin/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v3/win32/**/*",
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/arm64/**/*",
      "./node_modules/@img/sharp-darwin-arm64/**/*",
      "./node_modules/@img/sharp-darwin-x64/**/*",
      "./node_modules/@img/sharp-libvips-darwin-arm64/**/*",
      "./node_modules/@img/sharp-libvips-darwin-x64/**/*",
      "./node_modules/@img/sharp-wasm32/**/*",
      "./node_modules/@img/sharp-win32-*/**/*",
      "./node_modules/@img/sharp-libvips-win32-*/**/*",
      ...sharpTraceExcludesNonLinuxX64,
      "./node_modules/sharp/vendor/**/include/**/*",
      ...imglyBackgroundRemovalMediumChunkNames.map((name) => `${imglyDist}/${name}`),
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
