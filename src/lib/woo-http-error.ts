import { HTTPError } from "ky";

type WooLikeErrorBody = {
  message?: string;
  code?: string;
  error?: string;
  data?: {
    status?: number;
    params?: Record<string, string | string[] | unknown>;
  };
  additional_errors?: Array<{ message?: string; code?: string }>;
  errors?: Record<string, string | string[]>;
};

function pushStringParts(target: string[], value: unknown): void {
  if (typeof value === "string" && value.trim().length > 0) {
    target.push(value.trim());
    return;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      if (typeof item === "string" && item.trim().length > 0) {
        target.push(item.trim());
      }
    }
  }
}

/** Collects human-readable fragments from Woo / WordPress REST-style JSON bodies. */
function collectWooRestErrorMessages(data: unknown): string[] {
  const parts: string[] = [];
  if (!data || typeof data !== "object") {
    return parts;
  }
  const d = data as WooLikeErrorBody;
  pushStringParts(parts, d.message);
  pushStringParts(parts, d.error);

  if (d.data?.params && typeof d.data.params === "object") {
    for (const v of Object.values(d.data.params)) {
      pushStringParts(parts, v);
    }
  }

  if (d.errors && typeof d.errors === "object") {
    for (const v of Object.values(d.errors)) {
      pushStringParts(parts, v);
    }
  }

  if (Array.isArray(d.additional_errors)) {
    for (const item of d.additional_errors) {
      if (item?.message && typeof item.message === "string") {
        pushStringParts(parts, item.message);
      }
    }
  }

  return Array.from(new Set(parts));
}

/** Parses WooCommerce / WordPress REST JSON error bodies from a ky HTTPError. */
export async function formatWooHttpError(error: unknown): Promise<string> {
  if (error instanceof HTTPError) {
    try {
      const json: unknown = await error.response.json();
      const data = json as WooLikeErrorBody;
      const collected = collectWooRestErrorMessages(json);
      if (collected.length > 0) {
        const primary = collected.join(" ");
        return data.code ? `${primary} (${data.code})` : primary;
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
