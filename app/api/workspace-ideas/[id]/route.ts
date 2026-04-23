import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import { dbConfigured } from "@/lib/server/db";
import {
  deleteWorkspaceIdeaRecord,
  parseWorkspaceIdeaFormData,
  updateWorkspaceIdeaRecord,
} from "@/lib/server/ideas";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const proxied = await proxyApiRequest(request, `/api/workspace-ideas/${id}`);
  if (proxied) return proxied;

  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { body?: string };
  const formData = new FormData();
  formData.set("idea_id", id);
  formData.set("body", body.body ?? "");

  const result = await updateWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  revalidatePath("/");
  return NextResponse.json(result);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const proxied = await proxyApiRequest(request, `/api/workspace-ideas/${id}`);
  if (proxied) return proxied;

  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const result = await deleteWorkspaceIdeaRecord(id);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  revalidatePath("/");
  return NextResponse.json(result);
}
