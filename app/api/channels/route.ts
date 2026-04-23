import { handleNextApiRequest } from "@/lib/server/next-api";

export async function GET(request: Request) {
  return handleNextApiRequest(request, { pathname: "/api/channels" });
}

export async function POST(request: Request) {
  return handleNextApiRequest(request, { pathname: "/api/channels", revalidate: true });
}
