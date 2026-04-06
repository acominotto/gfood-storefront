import { describe, expect, it } from "vitest";
import { wooCustomerRowToWpUser } from "@/server/woocommerce/customers";

describe("wooCustomerRowToWpUser", () => {
  it("maps Woo customer row to WpUser", () => {
    expect(
      wooCustomerRowToWpUser({
        id: 12,
        email: "a@b.co",
        username: "u12",
        role: "customer",
      }),
    ).toEqual({
      id: 12,
      email: "a@b.co",
      username: "u12",
      roles: ["customer"],
      name: undefined,
    });
  });
});
