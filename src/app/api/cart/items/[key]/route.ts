import { cartResponseSchema, updateItemSchema } from "@/server/schemas/cart";
import { jsonError, jsonOk } from "@/server/api-response";
import { wooDelete, wooPatch } from "@/server/woo-request";

type Params = { params: Promise<{ key: string }> };

export async function PATCH(request: Request, { params }: Params) {
  try {
    const { key } = await params;
    const body = updateItemSchema.parse({ ...(await request.json()), key });
    const response = await wooPatch(`cart/update-item?key=${encodeURIComponent(key)}`, {
      quantity: body.quantity,
    });
    const cart = cartResponseSchema.parse(await response.json());
    return jsonOk(cart);
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Unable to update item");
  }
}

export async function DELETE(_: Request, { params }: Params) {
  try {
    const { key } = await params;
    const response = await wooDelete(`cart/remove-item?key=${encodeURIComponent(key)}`);
    const cart = cartResponseSchema.parse(await response.json());
    return jsonOk(cart);
  } catch (error) {
    return jsonError(400, error instanceof Error ? error.message : "Unable to remove item");
  }
}
