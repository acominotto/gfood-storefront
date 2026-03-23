import { checkoutSchema } from "@/server/schemas/cart";
import { jsonError, jsonOk } from "@/server/api-response";
import { wooPost } from "@/server/woo-request";

export async function POST(request: Request) {
  try {
    const payload = checkoutSchema.parse(await request.json());
    const response = await wooPost("checkout", payload);
    const data = await response.json();
    return jsonOk(data);
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Checkout failed");
  }
}
