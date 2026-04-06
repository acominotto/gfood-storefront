import { slugifyWpUsername } from "@/lib/wp-username-slug";
import { env } from "@/lib/env";
import { wpUserSchema } from "@/lib/schemas/wp-user";
import {
  createWooRegisteredCustomer,
  findWooCustomerByEmail,
  wooCustomerRowSchema,
  wooCustomerRowToWpUser,
} from "@/server/woocommerce/customers";
import { createWooRestClient, hasWooRestCredentials } from "@/server/woocommerce/woo-rest-client";
import { createWpClient } from "@/server/wordpress/wp-rest-admin-client";
import { isHTTPError } from "ky";
import { z } from "zod";

type WpUser = z.infer<typeof wpUserSchema>;

function splitDisplayName(name: string | null | undefined): { first_name: string; last_name: string } {
  const t = name?.trim() ?? "";
  if (!t) {
    return { first_name: "", last_name: "" };
  }
  const i = t.indexOf(" ");
  if (i === -1) {
    return { first_name: t, last_name: "" };
  }
  return { first_name: t.slice(0, i), last_name: t.slice(i + 1).trim() };
}

type SyncUserPayload = {
  email: string;
  name?: string | null;
  username: string;
};

type FindUserResult =
  | { ok: true; user: WpUser | null }
  | { ok: false; code: "auth" | "error" };

async function findWpUserByEmail(wp: ReturnType<typeof createWpClient>, email: string): Promise<FindUserResult> {
  try {
    const list = await wp
      .get("wp/v2/users", {
        searchParams: { search: email, context: "edit", per_page: "20" },
      })
      .parseJson(wpUserSchema.array());
    const normalized = email.trim().toLowerCase();
    const user = list.find((u) => u.email?.trim().toLowerCase() === normalized) ?? null;
    return { ok: true, user };
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

export async function findOrCreateWpUser(payload: SyncUserPayload) {
  const email = payload.email.trim().toLowerCase();

  if (hasWooRestCredentials()) {
    const woo = createWooRestClient();
    const lookup = await findWooCustomerByEmail(woo, email);
    if (!lookup.ok) {
      throw new Error(`WooCommerce customer lookup failed: ${lookup.code}`);
    }
    if (lookup.user) {
      return lookup.user;
    }
    const { first_name, last_name } = splitDisplayName(payload.name);
    try {
      const created = await woo
        .post("wc/v3/customers", {
          json: {
            email: payload.email,
            username: payload.username,
            password: crypto.randomUUID(),
            first_name,
            last_name,
          },
        })
        .parseJson(wooCustomerRowSchema);
      return wooCustomerRowToWpUser(created);
    } catch (e) {
      throw new Error("WooCommerce customer create failed", { cause: e });
    }
  }

  const wp = createWpClient();
  const search = await wp
    .get("wp/v2/users", {
      searchParams: { search: payload.email, context: "edit", per_page: "1" },
    })
    .parseJson(wpUserSchema.array());

  if (search.length > 0) {
    return search[0];
  }

  const endpoint = env.WP_SYNC_ENDPOINT.replace(/^\/+/, "");
  const created = await wp
    .post(endpoint, {
      json: {
        username: payload.username,
        email: payload.email,
        name: payload.name ?? payload.email.split("@")[0],
        password: crypto.randomUUID(),
      },
    })
    .parseJson(wpUserSchema);

  return created;
}

export type RegisterWpUserPayload = {
  email: string;
  password: string;
  name?: string | null;
};

export type RegisterWpUserResult =
  | { ok: true; user: WpUser }
  | { ok: false; code: "email_exists" | "create_failed" | "upstream_auth" };

/**
 * Creates a WooCommerce customer (WordPress user). Uses WooCommerce REST API when
 * `WOO_CONSUMER_KEY` / `WOO_CONSUMER_SECRET` are set; otherwise WordPress `wp/v2/users` + `WP_SYNC_*`.
 */
export async function registerWpUserWithPassword(payload: RegisterWpUserPayload): Promise<RegisterWpUserResult> {
  const email = payload.email.trim().toLowerCase();
  if (!email || !payload.password) {
    return { ok: false, code: "create_failed" };
  }

  if (hasWooRestCredentials()) {
    const woo = createWooRestClient();
    const lookup = await findWooCustomerByEmail(woo, email);
    if (!lookup.ok) {
      return { ok: false, code: lookup.code === "auth" ? "upstream_auth" : "create_failed" };
    }
    if (lookup.user) {
      return { ok: false, code: "email_exists" };
    }
    const local = email.split("@")[0] || "user";
    const username = `${slugifyWpUsername(local) || "user"}-${Math.floor(Math.random() * 99999)}`;
    const { first_name, last_name } = splitDisplayName(payload.name);
    return createWooRegisteredCustomer(woo, {
      email,
      username,
      password: payload.password,
      first_name,
      last_name,
    });
  }

  const wp = createWpClient();
  const lookup = await findWpUserByEmail(wp, email);
  if (!lookup.ok) {
    return { ok: false, code: lookup.code === "auth" ? "upstream_auth" : "create_failed" };
  }
  if (lookup.user) {
    return { ok: false, code: "email_exists" };
  }

  const local = email.split("@")[0] || "user";
  const username = `${slugifyWpUsername(local) || "user"}-${Math.floor(Math.random() * 99999)}`;
  const endpoint = env.WP_SYNC_ENDPOINT.replace(/^\/+/, "");
  const displayName = payload.name?.trim() || local;

  try {
    const created = await wp
      .post(endpoint, {
        json: {
          username,
          email,
          name: displayName,
          password: payload.password,
          roles: ["customer"],
        },
      })
      .parseJson(wpUserSchema);
    return { ok: true, user: created };
  } catch {
    return { ok: false, code: "create_failed" };
  }
}
