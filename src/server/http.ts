import { ky } from "zod-ky";
import { env } from "@/lib/env";

export function createHttpClient(prefixUrl: string, authHeader?: string) {
  return ky.create({
    prefixUrl,
    timeout: env.UPSTREAM_TIMEOUT_MS,
    hooks: {
      beforeRequest: [
        (request) => {
          request.headers.set("Accept", "application/json");
          if (authHeader) {
            request.headers.set("Authorization", authHeader);
          }
        },
      ],
    },
    retry: {
      limit: 1,
      methods: ["get", "head", "options", "put", "delete", "trace"],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    },
  });
}
