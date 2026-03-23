import { env } from "@/lib/env";
import { createHttpClient } from "@/server/http";
import { wpUserSchema } from "@/server/schemas/auth";

function getWpBaseUrl() {
  return new URL(env.WP_REST_BASE, env.WP_BASE_URL).toString();
}

function basicAuthHeader() {
  const credentials = Buffer.from(`${env.WP_SYNC_AUTH_USER}:${env.WP_SYNC_AUTH_PASS}`).toString("base64");
  return `Basic ${credentials}`;
}

export function createWpClient() {
  return createHttpClient(getWpBaseUrl(), basicAuthHeader());
}

type SyncUserPayload = {
  email: string;
  name?: string | null;
  username: string;
};

export async function findOrCreateWpUser(payload: SyncUserPayload) {
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
