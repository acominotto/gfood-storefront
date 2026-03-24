import { env } from "@/lib/env";
import { createHttpClient } from "@/server/http";
import { wpUserSchema } from "@/server/schemas/auth";

function getWpBaseUrl() {
  return new URL(env.WP_REST_BASE, env.WP_BASE_URL).toString();
}

function basicUserAuthHeader(identifier: string, password: string) {
  const raw = `${identifier}:${password}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

function extractJwtFromResponse(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.token === "string") return o.token;
  if (typeof o.jwt_token === "string") return o.jwt_token;
  if (typeof o.access_token === "string") return o.access_token;
  const data = o.data;
  if (data && typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (typeof d.token === "string") return d.token;
  }
  return null;
}

async function fetchCurrentUser(bearerOrBasic: string) {
  const client = createHttpClient(getWpBaseUrl(), bearerOrBasic);
  return client
    .get("wp/v2/users/me", { searchParams: { context: "edit" } })
    .parseJson(wpUserSchema);
}

/** WordPress JWT Authentication for WP REST API (and common response variants). */
async function tryJwtLogin(identifier: string, password: string) {
  const path = env.WP_JWT_AUTH_PATH.replace(/^\/+/, "");
  const anon = createHttpClient(getWpBaseUrl());
  try {
    const raw = await anon.post(path, { json: { username: identifier, password } }).json();
    const token = extractJwtFromResponse(raw);
    if (!token) return null;
    return await fetchCurrentUser(`Bearer ${token}`);
  } catch {
    return null;
  }
}

/** WordPress application passwords (REST Basic) — use WP username or an application password. */
async function tryApplicationPasswordLogin(identifier: string, password: string) {
  const client = createHttpClient(getWpBaseUrl(), basicUserAuthHeader(identifier, password));
  try {
    return await client
      .get("wp/v2/users/me", { searchParams: { context: "edit" } })
      .parseJson(wpUserSchema);
  } catch {
    return null;
  }
}

/**
 * Validates e-mail / username + password against WordPress:
 * 1) JWT auth endpoint (normal account password with JWT plugin)
 * 2) Application password via REST Basic auth (built-in WP)
 */
export async function authenticateWpUserWithPassword(identifier: string, password: string) {
  const id = identifier.trim();
  if (!id || !password) return null;

  const viaJwt = await tryJwtLogin(id, password);
  if (viaJwt?.id) return viaJwt;

  const viaApp = await tryApplicationPasswordLogin(id, password);
  if (viaApp?.id) return viaApp;

  return null;
}

export function getWpAccountUrls() {
  const origin = env.WP_BASE_URL.replace(/\/$/, "");
  return {
    lostPassword: `${origin}/wp-login.php?action=lostpassword`,
    register: `${origin}/wp-login.php?action=register`,
  };
}
