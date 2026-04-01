# G-Food Headless Storefront

Next.js storefront using WordPress and WooCommerce as headless backend.

## Stack

- Next.js (App Router, TypeScript)
- Chakra UI
- Zustand
- Zod + zod-ky
- next-intl
- NextAuth (Google)

## Run

1. Copy env vars:

```bash
cp .env.example .env.local
```

2. Install and start:

```bash
npm install
npm run dev
```

## Routes

- `/:locale` product listing (home) with facets + pagination
- `/:locale/cart` headless cart
- `/:locale/checkout` headless checkout
- `/:locale/login` Google sign in

## Internal API

- `GET /api/catalog/products`
- `GET /api/catalog/facets`
- `GET|POST|PATCH|PUT|DELETE /api/woo/*` proxy to WooCommerce Store API (same-origin; avoids CORS to WordPress)
- `GET /api/auth/me`
- `GET /api/images/*` optimized image proxy

## Commerce (WooCommerce)

All cart, checkout, shipping, tax, and payment rules are configured in **WordPress / WooCommerce** (and plugins). The storefront calls the **WooCommerce Store API** via `/api/woo/*` only; it does not duplicate Woo business logic.

Typical flow:

1. **Cart** — `GET/POST/PATCH/DELETE …/wc/store/v1/cart` (proxied as `/api/woo/cart`, etc.). The cart payload includes `payment_methods`, `shipping_rates`, `needs_shipping`, `needs_payment`, and addresses when Woo provides them.
2. **Checkout draft** — `GET` and `PUT /wc/store/v1/checkout` to load/update the draft order and recalculate totals (`__experimental_calc_totals=true` on `PUT`).
3. **Shipping** — `POST /wc/store/v1/cart/select-shipping-rate?package_id=…&rate_id=…` when the customer chooses a rate.
4. **Place order** — `POST /wc/store/v1/checkout` with billing and shipping addresses, `payment_method`, optional `customer_note` / `payment_data`. If the gateway returns `payment_result.redirect_url`, the app sends the browser there.

Configure **payment gateways**, **shipping zones**, and **tax** in Woo. Plugins that extend the Store API (e.g. via `extensions` on cart/checkout) are supported as long as responses stay JSON-shaped; plugins that only run on the classic/block checkout **page** in WordPress may require a redirect to that page or extra integration.

Environment variables: see `.env.example` (`WP_BASE_URL`, `WOO_STORE_API_BASE`, etc.).
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
