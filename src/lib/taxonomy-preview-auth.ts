import { timingSafeEqual } from "node:crypto";

export const TAXONOMY_PREVIEW_COOKIE = "woo_taxonomy_preview";

const EXPECTED = Buffer.from("cofood", "utf8");

export function verifyTaxonomyPreviewPassword(input: string): boolean {
  const buf = Buffer.from(input, "utf8");
  if (buf.length !== EXPECTED.length) {
    return false;
  }
  return timingSafeEqual(buf, EXPECTED);
}
