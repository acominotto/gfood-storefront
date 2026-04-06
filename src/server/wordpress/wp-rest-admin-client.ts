import { env } from "@/lib/env";
import { getWpRestBaseUrl } from "@/lib/wp-rest-url";
import { createHttpClient } from "@/server/http";

function basicSyncAuthHeader() {
  const user = env.WP_SYNC_AUTH_USER?.trim();
  const pass = env.WP_SYNC_AUTH_PASS?.trim();
  if (!user || !pass) {
    throw new Error("WP_SYNC_AUTH_USER and WP_SYNC_AUTH_PASS are required when WooCommerce REST keys are not configured.");
  }
  const credentials = Buffer.from(`${user}:${pass}`, "utf8").toString("base64");
  return `Basic ${credentials}`;
}

/** WordPress REST with application password (sync user). Prefer WooCommerce REST when keys exist for customer operations. */
export function createWpClient() {
  return createHttpClient(getWpRestBaseUrl(), basicSyncAuthHeader());
}
