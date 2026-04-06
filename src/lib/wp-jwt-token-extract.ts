/** Token fields returned by various WordPress JWT plugins. */
export function extractJwtFromResponse(body: unknown): string | null {
  if (!body || typeof body !== "object") return null;
  const o = body as Record<string, unknown>;
  if (typeof o.token === "string") return o.token;
  if (typeof o.jwt_token === "string") return o.jwt_token;
  if (typeof o.access_token === "string") return o.access_token;
  const data = o.data;
  if (data && typeof data === "object" && data !== null) {
    const d = data as Record<string, unknown>;
    if (typeof d.token === "string") return d.token;
  }
  return null;
}
