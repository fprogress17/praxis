import { handleNextApiRequest } from "@/lib/server/next-api";

export async function GET(request: Request) {
  return handleNextApiRequest(request, { pathname: "/api/bootstrap" });
}
