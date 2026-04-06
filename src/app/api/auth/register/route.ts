import { jsonError, jsonOk } from "@/server/api-response";
import { checkRateLimit } from "@/server/rate-limit";
import { isTrustedStorefrontClient } from "@/server/storefront-origin-guard";
import { registerWpUserWithPassword } from "@/server/wordpress/users";
import { z } from "zod";

const bodySchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(256),
  name: z.string().trim().max(200).optional(),
});

export async function POST(request: Request) {
  if (!isTrustedStorefrontClient(request)) {
    return jsonError(403, "FORBIDDEN");
  }

  const requestIp = request.headers.get("x-forwarded-for") ?? "local";
  const limiter = checkRateLimit(`auth-register:${requestIp}`, 15);
  if (!limiter.ok) {
    return jsonError(429, "RATE_LIMIT");
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

  const result = await registerWpUserWithPassword(parsed.data);
  if (!result.ok) {
    if (result.code === "email_exists") {
      return jsonError(409, "EMAIL_EXISTS");
    }
    if (result.code === "upstream_auth") {
      return jsonError(503, "BACKEND_AUTH");
    }
    return jsonError(400, "CREATE_FAILED");
  }

  return jsonOk({ ok: true as const });
}
