import { decode } from "html-entities";

/** Decode WordPress/Woo HTML entities in API strings (smart quotes, ampersands, etc.). */
export function decodeHtmlEntities(text: string): string {
  return decode(text);
}

/** Strip HTML to a single line of plain text (metadata, JSON-LD descriptions). */
export function stripHtmlToPlainText(html: string | undefined): string {
  if (!html) {
    return "";
  }
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}
