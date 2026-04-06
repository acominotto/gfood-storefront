import { describe, expect, it } from "vitest";
import { extractJwtFromResponse } from "@/lib/wp-jwt-token-extract";

describe("extractJwtFromResponse", () => {
  it("reads token", () => {
    expect(extractJwtFromResponse({ token: "abc.def.ghi" })).toBe("abc.def.ghi");
  });

  it("reads jwt_token", () => {
    expect(extractJwtFromResponse({ jwt_token: "mo" })).toBe("mo");
  });

  it("reads access_token", () => {
    expect(extractJwtFromResponse({ access_token: "at" })).toBe("at");
  });

  it("reads data.token", () => {
    expect(extractJwtFromResponse({ data: { token: "nested" } })).toBe("nested");
  });

  it("returns null when missing", () => {
    expect(extractJwtFromResponse({})).toBeNull();
    expect(extractJwtFromResponse(null)).toBeNull();
  });
});
