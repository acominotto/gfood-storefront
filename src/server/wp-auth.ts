import { env } from "@/lib/env";
import { wpUserSchema } from "@/lib/schemas/wp-user";
import { buildWooAccountLostPasswordUrl } from "@/lib/wp-account-urls";
import { analyzeJwtCredentialResponse } from "@/lib/wp-jwt-credential-user";
import { extractJwtFromResponse } from "@/lib/wp-jwt-token-extract";
import { getWpRestBaseUrl } from "@/lib/wp-rest-url";
import { createHttpClient } from "@/server/http";
import { getWooCustomerWpUserForEmail } from "@/server/woocommerce/customers";
import { isHTTPError } from "ky";
import type { z } from "zod";

type WpUser = z.infer<typeof wpUserSchema>;

const JWT_HTTP = { timeoutMs: 12_000, retryLimit: 0 } as const;

/** Reuse one Woo `GET customers` result for the login e-mail (avoids duplicate upstream calls). */
type WooEmailCache = { normalizedEmail: string; user: WpUser | null };

function authDebug(message: string, meta?: Record<string, unknown>) {
  if (!env.WP_AUTH_DEBUG) return;
  if (meta && Object.keys(meta).length > 0) {
    console.warn("[wp-auth]", message, meta);
  } else {
    console.warn("[wp-auth]", message);
  }
}

function httpStatus(e: unknown): number | undefined {
  return isHTTPError(e) ? e.response.status : undefined;
}

/**
 * When `WP_JWT_AUTH_PATH` is set in the environment, only that route is used (avoids hitting
 * Tmeister `jwt-auth/v1/token` on sites that only run miniOrange — those often return 403).
 * If unset, we try the schema default then the other common path.
 */
function jwtTokenPathCandidates(): string[] {
  const primary = env.WP_JWT_AUTH_PATH.replace(/^\/+/, "");
  const explicit = Boolean(process.env.WP_JWT_AUTH_PATH?.trim());
  if (explicit) return [primary];
  const wellKnown = ["jwt-auth/v1/token", "api/v1/token"];
  const rest = wellKnown.filter((p) => p !== primary);
  return [primary, ...rest];
}

/** miniOrange registers `…/api/v1/token` and expects form bodies; JSON POSTs often stall or fail. */
function isMiniOrangeStyleTokenPath(path: string): boolean {
  return path.includes("api/v1/token");
}

function basicUserAuthHeader(identifier: string, password: string) {
  const raw = `${identifier}:${password}`;
  return `Basic ${Buffer.from(raw, "utf8").toString("base64")}`;
}

/**
 * miniOrange (and some hosts) return 401 on `wp/v2/users/me` even with a valid JWT.
 * Prefer user id/email from the login JSON or JWT payload, then fall back to REST.
 */
async function resolveWpUserAfterToken(
  raw: unknown,
  token: string,
  wooEmailCache: WooEmailCache | null,
): Promise<WpUser | null> {
  const { resolvedUser, emailForWooFallback } = analyzeJwtCredentialResponse(raw, token);
  if (resolvedUser) return resolvedUser;

  if (emailForWooFallback) {
    const norm = emailForWooFallback.trim().toLowerCase();
    const wooUser =
      wooEmailCache && wooEmailCache.normalizedEmail === norm
        ? wooEmailCache.user
        : await getWooCustomerWpUserForEmail(emailForWooFallback);
    if (wooUser?.id) {
      authDebug("resolved user via Woo customer email after jwt", { id: wooUser.id });
      return wooUser;
    }
  }

  try {
    const client = createHttpClient(getWpRestBaseUrl(), `Bearer ${token}`, JWT_HTTP);
    return await client
      .get("wp/v2/users/me", { searchParams: { context: "edit" } })
      .parseJson(wpUserSchema);
  } catch (e) {
    authDebug("users/me failed after jwt (payload fallback also empty)", { status: httpStatus(e) });
    return null;
  }
}

async function fetchCurrentUser(bearerOrBasic: string) {
  const client = createHttpClient(getWpRestBaseUrl(), bearerOrBasic, JWT_HTTP);
  return client
    .get("wp/v2/users/me", { searchParams: { context: "edit" } })
    .parseJson(wpUserSchema);
}

function jwtLoginPayloads(identifier: string, password: string): Array<Record<string, string>> {
  const payloads: Array<Record<string, string>> = [{ username: identifier, password }];
  if (identifier.includes("@")) {
    payloads.push({ email: identifier, password }, { login: identifier, password });
  }
  const seen = new Set<string>();
  return payloads.filter((p) => {
    const key = JSON.stringify(p);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function tryJwtLoginFormUrlEncoded(
  path: string,
  identifier: string,
  password: string,
  wooEmailCache: WooEmailCache | null,
) {
  const anon = createHttpClient(getWpRestBaseUrl(), undefined, JWT_HTTP);
  const body = new URLSearchParams();
  body.set("username", identifier);
  body.set("password", password);
  try {
    const res = await anon.post(path, { body, throwHttpErrors: false });
    if (!res.ok) {
      authDebug("jwt form post non-ok", { path, status: res.status });
      return null;
    }
    const raw: unknown = await res.json();
    const token = extractJwtFromResponse(raw);
    if (!token) {
      authDebug("token response had no jwt field", { path });
      return null;
    }
    return await resolveWpUserAfterToken(raw, token, wooEmailCache);
  } catch (e) {
    authDebug("jwt form post failed", { path, status: httpStatus(e) });
    return null;
  }
}

async function tryJwtLogin(identifier: string, password: string, wooEmailCache: WooEmailCache | null) {
  const base = getWpRestBaseUrl();

  for (const path of jwtTokenPathCandidates()) {
    const skipJson = isMiniOrangeStyleTokenPath(path);
    const anon = createHttpClient(base, undefined, JWT_HTTP);

    if (!skipJson) {
      for (const json of jwtLoginPayloads(identifier, password)) {
        try {
          const res = await anon.post(path, { json, throwHttpErrors: false });
          if (!res.ok) {
            authDebug("jwt json post non-ok", { path, status: res.status });
            continue;
          }
          const raw: unknown = await res.json();
          const token = extractJwtFromResponse(raw);
          if (!token) continue;
          const user = await resolveWpUserAfterToken(raw, token, wooEmailCache);
          if (user?.id) return user;
        } catch (e) {
          authDebug("jwt json post failed", { path, status: httpStatus(e) });
        }
      }
    }

    const viaForm = await tryJwtLoginFormUrlEncoded(path, identifier, password, wooEmailCache);
    if (viaForm?.id) return viaForm;
  }

  return null;
}

async function tryApplicationPasswordLogin(identifier: string, password: string) {
  try {
    return await fetchCurrentUser(basicUserAuthHeader(identifier, password));
  } catch {
    return null;
  }
}

async function tryCredentialStrategies(
  primaryId: string,
  secondaryId: string | null,
  password: string,
  wooEmailCache: WooEmailCache | null,
): Promise<WpUser | null> {
  let user = await tryJwtLogin(primaryId, password, wooEmailCache);
  if (user?.id) return user;

  if (secondaryId && secondaryId.toLowerCase() !== primaryId.toLowerCase()) {
    user = await tryJwtLogin(secondaryId, password, wooEmailCache);
    if (user?.id) return user;
  }

  user = await tryApplicationPasswordLogin(primaryId, password);
  if (user?.id) return user;

  if (secondaryId && secondaryId.toLowerCase() !== primaryId.toLowerCase()) {
    user = await tryApplicationPasswordLogin(secondaryId, password);
    if (user?.id) return user;
  }

  return null;
}

/**
 * Validates e-mail / username + password against WordPress:
 * 1) JWT auth endpoint (normal account password with JWT plugin)
 * 2) Application password via REST Basic auth (built-in WP)
 */
export async function authenticateWpUserWithPassword(identifier: string, password: string) {
  try {
    const id = identifier.trim();
    if (!id || !password) return null;

    let wooEmailCache: WooEmailCache | null = null;
    let wooUsername: string | null = null;
    if (id.includes("@")) {
      const u = await getWooCustomerWpUserForEmail(id);
      wooEmailCache = { normalizedEmail: id.trim().toLowerCase(), user: u };
      wooUsername = u?.username?.trim() || null;
    }

    const user = await tryCredentialStrategies(id, wooUsername, password, wooEmailCache);
    if (user?.id) return user;

    authDebug("credential login failed (check WP_JWT_AUTH_PATH, miniOrange JWT settings, NEXTAUTH_URL)", {
      wpBase: getWpRestBaseUrl(),
    });
    return null;
  } catch (e) {
    authDebug("authenticateWpUserWithPassword error", { message: e instanceof Error ? e.message : String(e) });
    return null;
  }
}

/** WooCommerce “My account” lost-password page on the main WordPress site (French permalink). */
export function getWooAccountLostPasswordUrl() {
  return buildWooAccountLostPasswordUrl(env.WP_BASE_URL);
}
