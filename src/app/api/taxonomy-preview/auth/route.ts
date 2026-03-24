import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { jsonError } from "@/server/api-response";
import { checkRateLimit } from "@/server/rate-limit";
import { env } from "@/lib/env";
import { TAXONOMY_PREVIEW_COOKIE, verifyTaxonomyPreviewPassword } from "@/lib/taxonomy-preview-auth";

export async function POST(request: Request) {
  const requestIp = request.headers.get("x-forwarded-for") ?? "local";
  const limiter = checkRateLimit(`taxonomy-preview-auth:${requestIp}`);
  if (!limiter.ok) {
    return jsonError(429, "Rate limit exceeded");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "Invalid body");
  }

  const password =
    body !== null && typeof body === "object" && "password" in body && typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!verifyTaxonomyPreviewPassword(password)) {
    return jsonError(401, "Invalid password");
  }

  const cookieStore = await cookies();
  cookieStore.set(TAXONOMY_PREVIEW_COOKIE, "1", {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });

  return new NextResponse(null, { status: 204 });
}

export async function DELETE() {
  const cookieStore = await cookies();
  cookieStore.delete(TAXONOMY_PREVIEW_COOKIE);
  return new NextResponse(null, { status: 204 });
}
