/**
 * Decides whether a browser-originated request to a sensitive storefront API
 * is allowed (mitigates cross-site POST / CSRF for unauthenticated actions).
 *
 * @param getHeader - case-insensitive header lookup (e.g. `request.headers.get.bind(request.headers)`)
 * @param appOrigin - `new URL(NEXT_PUBLIC_APP_URL).origin`
 * @param nodeEnv - `process.env.NODE_ENV` style; in `test`, bare requests without browser metadata are allowed for automated tests
 */
export function trustStorefrontBrowserRequest(
  getHeader: (name: string) => string | null,
  appOrigin: string,
  nodeEnv: string,
): boolean {
  const secFetchSite = getHeader("sec-fetch-site");
  if (secFetchSite === "cross-site") {
    return false;
  }

  const origin = getHeader("origin");
  if (origin === appOrigin) {
    return true;
  }

  const referer = getHeader("referer");
  if (referer) {
    try {
      if (new URL(referer).origin === appOrigin) {
        return true;
      }
    } catch {
      /* ignore malformed referer */
    }
  }

  if (
    nodeEnv === "test" &&
    !origin &&
    !referer &&
    secFetchSite == null
  ) {
    return true;
  }

  return false;
}
