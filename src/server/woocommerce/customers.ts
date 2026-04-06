import { wpUserSchema } from "@/lib/schemas/wp-user";
import { createWooRestClient, hasWooRestCredentials } from "@/server/woocommerce/woo-rest-client";
import { isHTTPError } from "ky";
import { z } from "zod";

type WpUser = z.infer<typeof wpUserSchema>;

export const wooCustomerRowSchema = z.object({
  id: z.number(),
  email: z.string().optional(),
  username: z.string().optional(),
  role: z.string().optional(),
});

export function wooCustomerRowToWpUser(c: z.infer<typeof wooCustomerRowSchema>): WpUser {
  return {
    id: c.id,
    email: c.email,
    username: c.username,
    roles: c.role ? [c.role] : undefined,
    name: undefined,
  };
}

type FindUserResult =
  | { ok: true; user: WpUser | null }
  | { ok: false; code: "auth" | "error" };

export async function findWooCustomerByEmail(
  woo: ReturnType<typeof createWooRestClient>,
  email: string,
): Promise<FindUserResult> {
  try {
    const list = await woo
      .get("wc/v3/customers", {
        searchParams: { email: email.trim(), per_page: "20" },
      })
      .parseJson(wooCustomerRowSchema.array());
    const normalized = email.trim().toLowerCase();
    const row = list.find((c) => c.email?.trim().toLowerCase() === normalized) ?? null;
    return { ok: true, user: row ? wooCustomerRowToWpUser(row) : null };
  } catch (e) {
    if (isHTTPError(e)) {
      const status = e.response.status;
      if (status === 401 || status === 403) {
        return { ok: false, code: "auth" };
      }
    }
    return { ok: false, code: "error" };
  }
}

/** Full Woo customer row as `WpUser` (same id as WordPress user for typical Woo installs). */
export async function getWooCustomerWpUserForEmail(email: string): Promise<WpUser | null> {
  if (!hasWooRestCredentials()) return null;
  const woo = createWooRestClient();
  const lookup = await findWooCustomerByEmail(woo, email);
  if (!lookup.ok || !lookup.user) return null;
  return lookup.user;
}

/**
 * WooCommerce REST customer `username` (WP user_login). Thin wrapper — prefer
 * `getWooCustomerWpUserForEmail` when you also need id to avoid a second request.
 */
export async function getWooCustomerUsernameForEmail(email: string): Promise<string | null> {
  const u = await getWooCustomerWpUserForEmail(email);
  return u?.username?.trim() ?? null;
}

export async function createWooRegisteredCustomer(
  woo: ReturnType<typeof createWooRestClient>,
  body: {
    email: string;
    username: string;
    password: string;
    first_name: string;
    last_name: string;
  },
): Promise<
  | { ok: true; user: WpUser }
  | { ok: false; code: "email_exists" | "create_failed" | "upstream_auth" }
> {
  try {
    const created = await woo.post("wc/v3/customers", { json: body }).parseJson(wooCustomerRowSchema);
    return { ok: true, user: wooCustomerRowToWpUser(created) };
  } catch (e) {
    if (isHTTPError(e)) {
      const st = e.response.status;
      if (st === 401 || st === 403) {
        return { ok: false, code: "upstream_auth" };
      }
      if (st === 400) {
        const raw = await e.response.text();
        let code: string | undefined;
        try {
          code = (JSON.parse(raw) as { code?: string }).code;
        } catch {
          /* plain text error */
        }
        if (
          code === "registration-error-email-exists" ||
          code === "woocommerce_rest_customer_invalid_email" ||
          /email.*exist|already registered|already exist/i.test(raw)
        ) {
          return { ok: false, code: "email_exists" };
        }
      }
    }
    return { ok: false, code: "create_failed" };
  }
}
