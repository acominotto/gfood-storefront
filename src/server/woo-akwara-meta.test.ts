import { describe, expect, it } from "vitest";
import { parseAkwaraMetaKeysFromEnv } from "./woo-akwara-meta";

describe("parseAkwaraMetaKeysFromEnv", () => {
  it("uses defaults when unset", () => {
    expect(parseAkwaraMetaKeysFromEnv(undefined)).toContain("_akwara_id");
  });

  it("splits comma list", () => {
    expect(parseAkwaraMetaKeysFromEnv(" foo , bar ")).toEqual(["foo", "bar"]);
  });
});
