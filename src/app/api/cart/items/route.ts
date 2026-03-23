import { addItemSchema, cartResponseSchema } from "@/server/schemas/cart";
import { jsonError, jsonOk } from "@/server/api-response";
import { wooPost } from "@/server/woo-request";

export async function POST(request: Request) {
  try {
    const body = addItemSchema.parse(await request.json());
    const response = await wooPost("cart/add-item", body);
    const cart = cartResponseSchema.parse(await response.json());
    return jsonOk(cart);
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Unable to add item");
  }
}
