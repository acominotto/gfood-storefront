import { createWooClient, getWooSessionHeaders, persistWooSessionHeaders } from "@/server/woo-client";

export async function wooGet(path: string) {
  const woo = createWooClient();
  const headers = await getWooSessionHeaders();
  const response = await woo.get(path, { headers });
  await persistWooSessionHeaders(response.headers);
  return response;
}

export async function wooPost(path: string, json?: unknown) {
  const woo = createWooClient();
  const headers = await getWooSessionHeaders();
  const response = await woo.post(path, { headers, json });
  await persistWooSessionHeaders(response.headers);
  return response;
}

export async function wooPatch(path: string, json?: unknown) {
  const woo = createWooClient();
  const headers = await getWooSessionHeaders();
  const response = await woo.patch(path, { headers, json });
  await persistWooSessionHeaders(response.headers);
  return response;
}

export async function wooDelete(path: string) {
  const woo = createWooClient();
  const headers = await getWooSessionHeaders();
  const response = await woo.delete(path, { headers });
  await persistWooSessionHeaders(response.headers);
  return response;
}
