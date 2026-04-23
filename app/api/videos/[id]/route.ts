import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import { dbConfigured } from "@/lib/server/db";
import { deleteVideoRecord, parseVideoFormData, updateVideoRecord } from "@/lib/server/videos";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const proxied = await proxyApiRequest(request, `/api/videos/${id}`);
  if (proxied) return proxied;

  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { ok: false, error: "Expected multipart form data." },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  formData.set("id", id);
  const result = await updateVideoRecord(parseVideoFormData(formData));
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/");
  return NextResponse.json(result);
}

export async function DELETE(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const proxied = await proxyApiRequest(request, `/api/videos/${id}`);
  if (proxied) return proxied;

  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const result = await deleteVideoRecord(id);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/");
  return NextResponse.json(result);
}
