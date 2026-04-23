import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/server/db";
import { createLinkRecord, parseLinkFormData } from "@/lib/server/links";

export async function POST(request: Request) {
  if (!dbConfigured()) {
    return NextResponse.json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
  }

  const body = (await request.json()) as {
    channelId?: string | null;
    videoId?: string | null;
    title?: string;
    url?: string;
    note?: string;
  };
  const formData = new FormData();
  if (body.channelId) formData.set("channel_id", body.channelId);
  if (body.videoId) formData.set("video_id", body.videoId);
  formData.set("title", body.title ?? "");
  formData.set("url", body.url ?? "");
  formData.set("note", body.note ?? "");

  const result = await createLinkRecord(parseLinkFormData(formData));
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  revalidatePath("/");
  return NextResponse.json(result);
}
