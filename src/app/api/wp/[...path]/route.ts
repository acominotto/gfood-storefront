import { env } from "@/lib/env";
import { jsonError } from "@/server/api-response";

type Params = { params: Promise<{ path: string[] }> };

export async function GET(request: Request, { params }: Params) {
  try {
    const { path } = await params;
    const incoming = new URL(request.url);
    const upstream = new URL(`${env.WP_REST_BASE}/${path.join("/")}`, env.WP_BASE_URL);
    upstream.search = incoming.search;

    const response = await fetch(upstream, {
      headers: { Accept: "application/json" },
      next: { revalidate: 300, tags: ["wp-content"] },
    });

    const body = await response.text();
    return new Response(body, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=1200",
      },
    });
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Unable to proxy WP content");
  }
}
