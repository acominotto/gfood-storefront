import { env } from "@/lib/env";
import { trustStorefrontBrowserRequest } from "@/lib/storefront-origin-trust";

/**
 * Ensures the request comes from our storefront origin (see `NEXT_PUBLIC_APP_URL`).
 * Mitigates cross-site POST abuse; keep that env aligned with the URL users load in the browser
 * (including preview/staging hosts).
 */
export function isTrustedStorefrontClient(request: Request): boolean {
  const appOrigin = new URL(env.NEXT_PUBLIC_APP_URL).origin;
  return trustStorefrontBrowserRequest(
    (name) => request.headers.get(name),
    appOrigin,
    env.NODE_ENV,
  );
}
