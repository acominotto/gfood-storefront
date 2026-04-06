# Server modules and WordPress / WooCommerce HTTP

## Layering

- **`src/lib`**: deterministic logic (parsing, Zod schemas, URL helpers). Unit-test without calling WordPress.
- **`src/server`**: network I/O, secrets, Next.js route handlers. Prefer small files grouped by **which HTTP API** they speak to.

## Three upstream surfaces

| Surface | Base URL (env) | Typical auth | Used for |
|--------|------------------|--------------|----------|
| WordPress REST | `WP_BASE_URL` + `WP_REST_BASE` | Application password / sync user (`WP_SYNC_*`), or `Bearer` JWT after login | `wp/v2/*`, custom JWT token routes |
| WooCommerce REST | Same prefix as WP REST | `WOO_CONSUMER_KEY` + `WOO_CONSUMER_SECRET` (HTTP Basic) | `wc/v3/customers`, etc. |
| WooCommerce Store API | `WP_BASE_URL` + `WOO_STORE_API_BASE` | Session cookies (`Cart-Token`, `Nonce`) | `wc/store/v1/cart`, checkout |

Do not mix Store API clients with `wc/v3` Basic auth in the same module without making the distinction obvious in naming.

## File map (after refactor)

- `src/lib/schemas/wp-user.ts` — `wpUserSchema` (shared with server + JWT parsing).
- `src/lib/wp-rest-url.ts` — `getWpRestBaseUrl` / `resolveWpRestBaseUrl`.
- `src/lib/woo-store-url.ts` — `getWooStoreBaseUrl` / `resolveWooStoreBaseUrl`.
- `src/lib/wp-account-urls.ts` — lost-password URL builder.
- `src/lib/wp-jwt-credential-user.ts` — parse user from login JSON / JWT payload (no network).
- `src/lib/wp-jwt-token-extract.ts` — token field extraction from plugin JSON.
- `src/server/woocommerce/woo-rest-client.ts` — factory for `wc/v3` ky client.
- `src/server/woocommerce/customers.ts` — customer lookup / create via Woo REST.
- `src/server/wordpress/wp-rest-admin-client.ts` — WP REST with sync application password.
- `src/server/wordpress/users.ts` — find/create/register users (orchestrates Woo vs WP paths).
- `src/server/wp-auth.ts` — credential login (JWT + app password + Woo cache).
- `src/server/woo-client.ts` — Store API session cookies; base URL via `getWooStoreBaseUrl`.
