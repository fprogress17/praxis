import { handleNextApiRequest } from "@/lib/server/next-api";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function GET(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleNextApiRequest(request, { pathname: `/api/files/${id}` });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleNextApiRequest(request, { pathname: `/api/files/${id}`, revalidate: true });
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  return handleNextApiRequest(request, { pathname: `/api/files/${id}`, revalidate: true });
}
