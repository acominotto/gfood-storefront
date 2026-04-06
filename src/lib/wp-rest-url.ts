import { env } from "@/lib/env";

/** Pure URL resolution (testable without loading app env). */
export function resolveWpRestBaseUrl(wpBaseUrl: string, wpRestBasePath: string): string {
  return new URL(wpRestBasePath, wpBaseUrl).toString();
}

/** WordPress REST API base URL (`WP_BASE_URL` + `WP_REST_BASE`). */
export function getWpRestBaseUrl(): string {
  return resolveWpRestBaseUrl(env.WP_BASE_URL, env.WP_REST_BASE);
}
