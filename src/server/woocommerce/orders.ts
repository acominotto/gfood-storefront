import { isHTTPError } from "ky";
import { z } from "zod";
import { getWooCustomerWpUserForEmail } from "@/server/woocommerce/customers";
import { createWooRestClient, hasWooRestCredentials } from "@/server/woocommerce/woo-rest-client";

export const wooOrderListItemSchema = z.object({
  id: z.number(),
  number: z.string(),
  status: z.string(),
  date_created: z.string(),
  currency: z.string(),
  total: z.string(),
  order_key: z.string().optional(),
});

export type WooOrderListItem = z.infer<typeof wooOrderListItemSchema>;

const wooOrderApiRowSchema = wooOrderListItemSchema.extend({
  customer_id: z.coerce.number().optional(),
  billing: z.object({ email: z.string().optional() }).optional(),
});

export type ListOrdersForCustomerResult =
  | { ok: true; orders: WooOrderListItem[] }
  | { ok: false; code: "no_credentials" | "http_error" | "parse_error" };

export type LinkGuestOrderResult =
  | { ok: true; alreadyLinked?: boolean }
  | {
      ok: false;
      code:
        | "no_credentials"
        | "not_found"
        | "bad_key"
        | "already_other_customer"
        | "woo_error";
    };

const ORDERS_PER_PAGE = 20;

function toListItem(row: z.infer<typeof wooOrderApiRowSchema>): WooOrderListItem {
  return {
    id: row.id,
    number: row.number,
    status: row.status,
    date_created: row.date_created,
    currency: row.currency,
    total: row.total,
    order_key: row.order_key,
  };
}

async function fetchOrderRows(
  woo: ReturnType<typeof createWooRestClient>,
  searchParams: Record<string, string>,
): Promise<
  | { ok: true; rows: z.infer<typeof wooOrderApiRowSchema>[] }
  | { ok: false; code: "http_error" | "parse_error" }
> {
  try {
    const raw: unknown = await woo.get("wc/v3/orders", { searchParams }).json();
    const parsed = z.array(wooOrderApiRowSchema).safeParse(raw);
    if (!parsed.success) {
      return { ok: false, code: "parse_error" };
    }
    return { ok: true, rows: parsed.data };
  } catch (e) {
    if (isHTTPError(e)) {
      return { ok: false, code: "http_error" };
    }
    return { ok: false, code: "http_error" };
  }
}

export async function resolveWooCustomerIdForAccount(opts: {
  wpUserId?: number;
  email?: string | null;
}): Promise<number | null> {
  if (typeof opts.wpUserId === "number" && Number.isFinite(opts.wpUserId) && opts.wpUserId > 0) {
    return opts.wpUserId;
  }
  const email = opts.email?.trim();
  if (!email) {
    return null;
  }
  const user = await getWooCustomerWpUserForEmail(email);
  return typeof user?.id === "number" && user.id > 0 ? user.id : null;
}

/**
 * Orders owned by this Woo customer id, plus guest orders (`customer_id` 0) whose
 * billing e-mail matches `accountEmail` (Woo `search` + strict billing filter).
 */
export async function listOrdersForSignedInAccount(
  customerId: number,
  accountEmail: string | null | undefined,
): Promise<ListOrdersForCustomerResult> {
  if (!hasWooRestCredentials()) {
    return { ok: false, code: "no_credentials" };
  }

  const woo = createWooRestClient();
  const baseParams = {
    orderby: "date",
    order: "desc",
    per_page: String(ORDERS_PER_PAGE),
  } as const;

  const byCustomer = await fetchOrderRows(woo, {
    ...baseParams,
    customer: String(customerId),
  });
  if (!byCustomer.ok) {
    return { ok: false, code: byCustomer.code };
  }

  const emailNorm = accountEmail?.trim().toLowerCase();
  let guestRows: z.infer<typeof wooOrderApiRowSchema>[] = [];
  if (emailNorm && accountEmail?.trim()) {
    const searchQ = accountEmail.trim();
    const bySearch = await fetchOrderRows(woo, {
      ...baseParams,
      per_page: "50",
      search: searchQ,
    });
    if (bySearch.ok) {
      guestRows = bySearch.rows.filter(
        (o) =>
          (o.customer_id ?? 0) === 0 && o.billing?.email?.trim().toLowerCase() === emailNorm,
      );
    }
  }

  const byId = new Map<number, WooOrderListItem>();
  for (const row of [...byCustomer.rows, ...guestRows]) {
    byId.set(row.id, toListItem(row));
  }

  const merged = [...byId.values()].sort(
    (a, b) => new Date(b.date_created).getTime() - new Date(a.date_created).getTime(),
  );

  return { ok: true, orders: merged.slice(0, ORDERS_PER_PAGE) };
}

const wooOrderVerifySchema = z.object({
  id: z.number(),
  order_key: z.string(),
  customer_id: z.coerce.number().optional(),
});

/**
 * Attach a guest order to a Woo customer using the secret `order_key` from checkout.
 * Requires REST credentials with write access to orders.
 */
export async function linkGuestOrderToCustomer(
  orderId: number,
  orderKey: string,
  customerId: number,
): Promise<LinkGuestOrderResult> {
  if (!hasWooRestCredentials()) {
    return { ok: false, code: "no_credentials" };
  }
  const key = orderKey.trim();
  if (!key) {
    return { ok: false, code: "bad_key" };
  }

  const woo = createWooRestClient();
  try {
    const raw: unknown = await woo.get(`wc/v3/orders/${orderId}`).json();
    const parsed = wooOrderVerifySchema.safeParse(raw);
    if (!parsed.success) {
      return { ok: false, code: "not_found" };
    }
    const o = parsed.data;
    if (o.order_key !== key) {
      return { ok: false, code: "bad_key" };
    }

    const existing = o.customer_id ?? 0;
    if (existing === customerId) {
      return { ok: true, alreadyLinked: true };
    }
    if (existing > 0) {
      return { ok: false, code: "already_other_customer" };
    }

    await woo.put(`wc/v3/orders/${orderId}`, {
      json: { customer_id: customerId },
    });
    return { ok: true };
  } catch (e) {
    if (isHTTPError(e) && e.response.status === 404) {
      return { ok: false, code: "not_found" };
    }
    return { ok: false, code: "woo_error" };
  }
}
