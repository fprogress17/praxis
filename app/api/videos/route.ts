import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import { dbConfigured } from "@/lib/server/db";
import { createVideoRecord, parseVideoFormData } from "@/lib/server/videos";

export async function POST(request: Request) {
  const proxied = await proxyApiRequest(request, "/api/videos");
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
  const result = await createVideoRecord(parseVideoFormData(formData));
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/");
  return NextResponse.json(result);
}
