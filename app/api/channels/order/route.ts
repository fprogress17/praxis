import { handleNextApiRequest } from "@/lib/server/next-api";

export async function PATCH(request: Request) {
  return handleNextApiRequest(request, { pathname: "/api/channels/order", revalidate: true });
}
