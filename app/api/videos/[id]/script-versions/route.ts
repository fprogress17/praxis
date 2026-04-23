import { handleNextApiRequest } from "@/lib/server/next-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleNextApiRequest(request, { pathname: `/api/videos/${id}/script-versions` });
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleNextApiRequest(request, { pathname: `/api/videos/${id}/script-versions` });
}
