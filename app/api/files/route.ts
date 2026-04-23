import { handleNextApiRequest } from "@/lib/server/next-api";

export async function POST(request: Request) {
  return handleNextApiRequest(request, { pathname: "/api/files", revalidate: true });
}
