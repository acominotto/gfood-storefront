import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { imglyBackgroundRemovalMediumChunkNames } from "./src/lib/imgly-medium-model-assets";
import { imglyBackgroundRemovalSmallChunkNames } from "./src/lib/imgly-small-model-assets";

const imglyDist = "./node_modules/@imgly/background-removal-node/dist";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Keep native addons out of the Turbopack bundle so `onnxruntime-node` loads
  // `libonnxruntime.so.*` from `node_modules/onnxruntime-node/bin/...` (Vercel
  // otherwise traced only the `.node` file and failed at runtime).
  serverExternalPackages: ["onnxruntime-node", "@imgly/background-removal-node"],
  // Linux x64 only for ORT; include medium model chunks only (not full `dist/`).
  outputFileTracingIncludes: {
    "/app/api/images/**/*": [
      "./node_modules/onnxruntime-node/bin/napi-v3/linux/x64/**/*",
      `${imglyDist}/resources.json`,
      ...imglyBackgroundRemovalMediumChunkNames.map((name) => `${imglyDist}/${name}`),
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
      // Runtime does not need C headers bundled with sharp's prebuild vendor trees.
      "./node_modules/sharp/vendor/**/include/**/*",
      "./node_modules/@imgly/background-removal-node/node_modules/sharp/vendor/**/include/**/*",
      ...imglyBackgroundRemovalSmallChunkNames.map((name) => `${imglyDist}/${name}`),
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
