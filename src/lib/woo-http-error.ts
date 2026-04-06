import { HTTPError } from "ky";

/** Parses WooCommerce / WordPress REST JSON error bodies from a ky HTTPError. */
export async function formatWooHttpError(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const data = (await error.response.json()) as {
        message?: string;
        code?: string;
        /** Next.js API routes (`jsonError`) and some proxies use `error`. */
        error?: string;
      };
      const text =
        typeof data.message === "string" && data.message.length > 0
          ? data.message
          : typeof data.error === "string" && data.error.length > 0
            ? data.error
            : "";
      if (text.length > 0) {
        return data.code ? `${text} (${data.code})` : text;
      }
    } catch {
      /* ignore non-JSON */
    }
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}
