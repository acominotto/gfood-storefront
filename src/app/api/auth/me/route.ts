import { getServerSession } from "next-auth";
import { authOptions } from "@/server/auth-options";
import { jsonError, jsonOk } from "@/server/api-response";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return jsonError(401, "Unauthenticated");
  }
  return jsonOk(session);
}
