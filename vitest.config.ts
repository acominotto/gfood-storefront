import path from "node:path";
import { defineConfig, defaultExclude } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    exclude: [...defaultExclude, "**/e2e/**"],
    env: {
      NODE_ENV: "test",
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      NEXTAUTH_URL: "http://localhost:3000",
      NEXTAUTH_SECRET: "vitest_secret_at_least_32_characters_00",
      GOOGLE_CLIENT_ID: "vitest-google-id",
      GOOGLE_CLIENT_SECRET: "vitest-google-secret",
      WP_BASE_URL: "http://localhost:8080",
      WP_SYNC_AUTH_USER: "vitest-sync",
      WP_SYNC_AUTH_PASS: "vitest-sync-pass",
    },
  },
});
