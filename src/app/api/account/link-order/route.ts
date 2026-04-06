import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/server/auth-options";
import { jsonError, jsonOk } from "@/server/api-response";
import { checkRateLimit } from "@/server/rate-limit";
import {
  linkGuestOrderToCustomer,
  resolveWooCustomerIdForAccount,
} from "@/server/woocommerce/orders";
import { isTrustedStorefrontClient } from "@/server/storefront-origin-guard";

const bodySchema = z.object({
  orderId: z.number().int().positive(),
  orderKey: z.string().trim().min(1).max(200),
});

export async function POST(request: Request) {
  if (!isTrustedStorefrontClient(request)) {
    return jsonError(403, "FORBIDDEN");
  }

  const requestIp = request.headers.get("x-forwarded-for") ?? "local";
  const limiter = checkRateLimit(`link-order:${requestIp}`, 40);
  if (!limiter.ok) {
    return jsonError(429, "RATE_LIMIT");
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return jsonError(401, "UNAUTHORIZED");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON");
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "INVALID_REQUEST");
  }

  const customerId = await resolveWooCustomerIdForAccount({
    wpUserId: session.user.wpUserId,
    email: session.user.email,
  });
  if (customerId == null) {
    return jsonError(400, "NO_CUSTOMER");
  }

  const result = await linkGuestOrderToCustomer(
    parsed.data.orderId,
    parsed.data.orderKey,
    customerId,
  );

  if (!result.ok) {
    if (result.code === "no_credentials") {
      return jsonError(503, "BACKEND_CONFIG");
    }
    if (result.code === "bad_key" || result.code === "not_found") {
      return jsonError(400, "ORDER_NOT_FOUND");
    }
    if (result.code === "already_other_customer") {
      return jsonError(409, "ORDER_CLAIMED");
    }
    return jsonError(502, "WOO_ERROR");
  }

  return jsonOk({ ok: true as const, alreadyLinked: result.alreadyLinked === true });
}
