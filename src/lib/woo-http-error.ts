import { HTTPError } from "ky";

/** Parses WooCommerce / WordPress REST JSON error bodies from a ky HTTPError. */
export async function formatWooHttpError(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const data = (await error.response.json()) as { message?: string; code?: string };
      if (typeof data.message === "string" && data.message.length > 0) {
        return data.code ? `${data.message} (${data.code})` : data.message;
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
