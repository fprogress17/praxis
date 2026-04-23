import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/server/db";
import { deleteLinkRecord, parseLinkFormData, updateLinkRecord } from "@/lib/server/links";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as { title?: string; url?: string; note?: string };
  const formData = new FormData();
  formData.set("id", id);
  formData.set("title", body.title ?? "");
  formData.set("url", body.url ?? "");
  formData.set("note", body.note ?? "");

  const result = await updateLinkRecord(parseLinkFormData(formData));
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  revalidatePath("/");
  return NextResponse.json(result);
}

export async function DELETE(_request: Request, context: RouteContext) {
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  const { id } = await context.params;
  const result = await deleteLinkRecord(id);
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  revalidatePath("/");
  return NextResponse.json(result);
}
