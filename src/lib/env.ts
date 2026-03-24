import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32),
  GOOGLE_CLIENT_ID: z.string().min(1),
  GOOGLE_CLIENT_SECRET: z.string().min(1),
  WP_BASE_URL: z.string().url(),
  WP_REST_BASE: z.string().default("/wp-json"),
  WP_SYNC_ENDPOINT: z.string().default("/wp/v2/users"),
  WP_SYNC_AUTH_USER: z.string().min(1),
  WP_SYNC_AUTH_PASS: z.string().min(1),
  WP_JWT_AUTH_PATH: z.string().default("jwt-auth/v1/token"),
  WOO_STORE_API_BASE: z.string().default("/wp-json/wc/store/v1"),
  WOO_CONSUMER_KEY: z.string().optional(),
  WOO_CONSUMER_SECRET: z.string().optional(),
  IMAGE_PROXY_CACHE_TTL: z.coerce.number().int().positive().default(3600),
  IMAGE_PROXY_MAX_WIDTH: z.coerce.number().int().positive().default(1600),
  IMAGE_PROXY_MAX_HEIGHT: z.coerce.number().int().positive().default(1600),
  IMAGE_PROXY_THUMB_WIDTH: z.coerce.number().int().positive().default(500),
  IMAGE_PROXY_THUMB_HEIGHT: z.coerce.number().int().positive().default(500),
  IMAGE_PROXY_QUALITY_DEFAULT: z.coerce.number().int().min(20).max(95).default(75),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(120),
});

const parsed = envSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  WP_BASE_URL: process.env.WP_BASE_URL,
  WP_REST_BASE: process.env.WP_REST_BASE,
  WP_SYNC_ENDPOINT: process.env.WP_SYNC_ENDPOINT,
  WP_SYNC_AUTH_USER: process.env.WP_SYNC_AUTH_USER,
  WP_SYNC_AUTH_PASS: process.env.WP_SYNC_AUTH_PASS,
  WP_JWT_AUTH_PATH: process.env.WP_JWT_AUTH_PATH,
  WOO_STORE_API_BASE: process.env.WOO_STORE_API_BASE,
  WOO_CONSUMER_KEY: process.env.WOO_CONSUMER_KEY,
  WOO_CONSUMER_SECRET: process.env.WOO_CONSUMER_SECRET,
  IMAGE_PROXY_CACHE_TTL: process.env.IMAGE_PROXY_CACHE_TTL,
  IMAGE_PROXY_MAX_WIDTH: process.env.IMAGE_PROXY_MAX_WIDTH,
  IMAGE_PROXY_MAX_HEIGHT: process.env.IMAGE_PROXY_MAX_HEIGHT,
  IMAGE_PROXY_THUMB_WIDTH: process.env.IMAGE_PROXY_THUMB_WIDTH,
  IMAGE_PROXY_THUMB_HEIGHT: process.env.IMAGE_PROXY_THUMB_HEIGHT,
  IMAGE_PROXY_QUALITY_DEFAULT: process.env.IMAGE_PROXY_QUALITY_DEFAULT,
  UPSTREAM_TIMEOUT_MS: process.env.UPSTREAM_TIMEOUT_MS,
  RATE_LIMIT_PER_MINUTE: process.env.RATE_LIMIT_PER_MINUTE,
});

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;
