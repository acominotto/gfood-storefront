import { describe, expect, it } from "vitest";
import { decodeHtmlEntities, stripHtmlToPlainText } from "./html-plain";

describe("decodeHtmlEntities", () => {
  it("decodes numeric entities (e.g. &#8217; → U+2019 RIGHT SINGLE QUOTATION MARK)", () => {
    expect(decodeHtmlEntities("COMPAL JUS D&#8217;ORANGE 1L")).toBe("COMPAL JUS D\u2019ORANGE 1L");
  });

  it("decodes named entities", () => {
    expect(decodeHtmlEntities("Liqueurs &amp; Spiritueux")).toBe("Liqueurs & Spiritueux");
  });
});

describe("stripHtmlToPlainText", () => {
  it("strips tags and normalizes spaces", () => {
    expect(stripHtmlToPlainText("<p>Hello&nbsp; <em>world</em></p>")).toBe("Hello world");
  });
});
