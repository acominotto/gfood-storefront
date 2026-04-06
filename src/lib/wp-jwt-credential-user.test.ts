import { describe, expect, it } from "vitest";
import { analyzeJwtCredentialResponse, parseWpUserFromJwtCredentialResponse } from "@/lib/wp-jwt-credential-user";

describe("parseWpUserFromJwtCredentialResponse", () => {
  it("reads Tmeister-style JWT payload", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        data: {
          user: {
            id: "42",
            user_login: "shopper",
            user_email: "shopper@example.com",
            display_name: "Shopper",
            role: "customer",
          },
        },
      }),
    ).toString("base64url");
    const jwt = `${header}.${payload}.sig`;
    const user = parseWpUserFromJwtCredentialResponse({}, jwt);
    expect(user).toEqual({
      id: 42,
      email: "shopper@example.com",
      name: "Shopper",
      username: "shopper",
      roles: ["customer"],
    });
  });

  it("reads top-level id from JWT payload (miniOrange-style)", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const payload = Buffer.from(
      JSON.stringify({
        id: 99,
        email: "mo@example.com",
        user_login: "mo99",
      }),
    ).toString("base64url");
    const jwt = `${header}.${payload}.x`;
    const user = parseWpUserFromJwtCredentialResponse({}, jwt);
    expect(user).toMatchObject({
      id: 99,
      email: "mo@example.com",
      username: "mo99",
    });
  });

  it("reads user from login JSON body", () => {
    const user = parseWpUserFromJwtCredentialResponse(
      { user_id: 7, user_email: "a@b.co", username: "u7" },
      "not.a.jwt",
    );
    expect(user).toMatchObject({
      id: 7,
      email: "a@b.co",
      username: "u7",
    });
  });
});

describe("analyzeJwtCredentialResponse", () => {
  it("returns email fallback when JWT has no numeric user id", () => {
    const header = Buffer.from(JSON.stringify({ alg: "HS256" })).toString("base64url");
    const payload = Buffer.from(JSON.stringify({ email: "only@example.com" })).toString("base64url");
    const jwt = `${header}.${payload}.x`;
    const r = analyzeJwtCredentialResponse({}, jwt);
    expect(r.resolvedUser).toBeNull();
    expect(r.emailForWooFallback).toBe("only@example.com");
  });
});
