import { wpUserSchema } from "@/lib/schemas/wp-user";
import { z } from "zod";

type WpUser = z.infer<typeof wpUserSchema>;

function coerceWpUserId(v: unknown): number | null {
  if (typeof v === "number" && Number.isInteger(v) && v > 0) return v;
  if (typeof v === "string" && /^\d+$/.test(v)) {
    const n = parseInt(v, 10);
    return n > 0 ? n : null;
  }
  return null;
}

function pickEmailFromRecord(o: Record<string, unknown>): string | undefined {
  for (const key of ["user_email", "email"]) {
    const v = o[key];
    if (typeof v === "string") {
      const parsed = z.email().safeParse(v);
      if (parsed.success) return parsed.data;
    }
  }
  return undefined;
}

function parseLoginJsonForUser(body: unknown): Partial<WpUser> | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;

  let id = coerceWpUserId(o.user_id) ?? coerceWpUserId(o.userId) ?? coerceWpUserId(o.id);
  let email = pickEmailFromRecord(o);
  let username =
    typeof o.username === "string"
      ? o.username
      : typeof o.user_login === "string"
        ? o.user_login
        : undefined;
  let name =
    typeof o.name === "string"
      ? o.name
      : typeof o.display_name === "string"
        ? o.display_name
        : undefined;

  const nested = o.user;
  if (nested && typeof nested === "object" && nested !== null) {
    const u = nested as Record<string, unknown>;
    id = id ?? coerceWpUserId(u.id) ?? coerceWpUserId(u.ID);
    email = email ?? pickEmailFromRecord(u);
    username =
      username ??
      (typeof u.username === "string"
        ? u.username
        : typeof u.user_login === "string"
          ? u.user_login
          : typeof u.user_nicename === "string"
            ? u.user_nicename
            : undefined);
    name = name ?? (typeof u.display_name === "string" ? u.display_name : undefined);
  }

  if (id == null) return null;
  const roles =
    typeof o.role === "string"
      ? [o.role]
      : Array.isArray(o.roles)
        ? o.roles.filter((x): x is string => typeof x === "string")
        : undefined;

  return { id, email, name, username, roles };
}

function decodeJwtPayloadJson(jwt: string): unknown | null {
  const parts = jwt.split(".");
  if (parts.length < 2 || !parts[1]) return null;
  const segment = parts[1];
  try {
    const json = Buffer.from(segment, "base64url").toString("utf8");
    return JSON.parse(json) as unknown;
  } catch {
    try {
      const pad = segment + "=".repeat((4 - (segment.length % 4)) % 4);
      const json = Buffer.from(pad, "base64").toString("utf8");
      return JSON.parse(json) as unknown;
    } catch {
      return null;
    }
  }
}

function parseJwtClaimsForUser(payload: unknown): Partial<WpUser> | null {
  if (!payload || typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;

  const data = o.data;
  if (data && typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const user = d.user;
    if (user && typeof user === "object" && user !== null) {
      const u = user as Record<string, unknown>;
      const id = coerceWpUserId(u.id ?? u.ID);
      if (id != null) {
        const roleVal = u.role;
        const roles =
          typeof roleVal === "string"
            ? [roleVal]
            : Array.isArray(roleVal)
              ? roleVal.filter((x): x is string => typeof x === "string")
              : undefined;
        return {
          id,
          email: pickEmailFromRecord(u),
          username:
            typeof u.user_login === "string"
              ? u.user_login
              : typeof u.username === "string"
                ? u.username
                : typeof u.user_nicename === "string"
                  ? u.user_nicename
                  : undefined,
          name: typeof u.display_name === "string" ? u.display_name : undefined,
          roles,
        };
      }
    }
  }

  const topLevelId =
    coerceWpUserId(o.user_id) ??
    coerceWpUserId(o.userId) ??
    coerceWpUserId(o.id) ??
    coerceWpUserId(o.uid);
  if (topLevelId != null) {
    const roleVal = o.role;
    const roles =
      typeof roleVal === "string"
        ? [roleVal]
        : Array.isArray(roleVal)
          ? roleVal.filter((x): x is string => typeof x === "string")
          : undefined;
    return {
      id: topLevelId,
      email: pickEmailFromRecord(o),
      username:
        typeof o.user_login === "string"
          ? o.user_login
          : typeof o.username === "string"
            ? o.username
            : undefined,
      name:
        typeof o.display_name === "string"
          ? o.display_name
          : typeof o.name === "string"
            ? o.name
            : undefined,
      roles,
    };
  }

  const subId = coerceWpUserId(o.sub);
  if (subId != null) {
    return {
      id: subId,
      email: pickEmailFromRecord(o),
      username: typeof o.username === "string" ? o.username : undefined,
    };
  }

  return null;
}

function extractEmailFromJwtPayload(claims: unknown): string | undefined {
  if (!claims || typeof claims !== "object") return undefined;
  const o = claims as Record<string, unknown>;
  const top = pickEmailFromRecord(o);
  if (top) return top;
  const data = o.data;
  if (data && typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    const nested = pickEmailFromRecord(d);
    if (nested) return nested;
    const user = d.user;
    if (user && typeof user === "object" && user !== null) {
      return pickEmailFromRecord(user as Record<string, unknown>);
    }
  }
  return undefined;
}

function safeParseWpUser(partial: Partial<WpUser>): WpUser | null {
  const parsed = wpUserSchema.safeParse(partial);
  return parsed.success ? parsed.data : null;
}

/**
 * Parse login JSON + JWT without network. If no full user, still returns an e-mail for Woo fallback.
 */
export function analyzeJwtCredentialResponse(
  raw: unknown,
  jwtToken: string,
): { resolvedUser: WpUser | null; emailForWooFallback: string | undefined } {
  const fromLogin = parseLoginJsonForUser(raw);
  if (fromLogin?.id != null) {
    const u = safeParseWpUser(fromLogin);
    if (u) return { resolvedUser: u, emailForWooFallback: u.email };
  }

  const claims = decodeJwtPayloadJson(jwtToken);
  const fromJwt = claims ? parseJwtClaimsForUser(claims) : null;
  if (fromJwt?.id != null) {
    const u = safeParseWpUser(fromJwt);
    if (u) return { resolvedUser: u, emailForWooFallback: u.email };
  }

  const emailForWoo = fromLogin?.email ?? fromJwt?.email ?? extractEmailFromJwtPayload(claims);
  return { resolvedUser: null, emailForWooFallback: emailForWoo };
}

/** Sync: user from login JSON or JWT payload only (no `users/me`). */
export function parseWpUserFromJwtCredentialResponse(raw: unknown, jwtToken: string): WpUser | null {
  return analyzeJwtCredentialResponse(raw, jwtToken).resolvedUser;
}
