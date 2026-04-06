import { ky } from "zod-ky";
import { env } from "@/lib/env";

export type HttpClientOptions = {
  timeoutMs?: number;
  /** Ky retry limit (0 disables retries). */
  retryLimit?: number;
};

export function createHttpClient(prefixUrl: string, authHeader?: string, opts?: HttpClientOptions) {
  return ky.create({
    prefixUrl,
    timeout: opts?.timeoutMs ?? env.UPSTREAM_TIMEOUT_MS,
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
      limit: opts?.retryLimit ?? 1,
      methods: ["get", "head", "options", "put", "delete", "trace"],
      statusCodes: [408, 413, 429, 500, 502, 503, 504],
    },
  });
}
