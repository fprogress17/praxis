import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import { createChannelRecord, parseChannelFormData } from "@/lib/server/channels";
import { dbConfigured } from "@/lib/server/db";
import { getWorkspaceSnapshot } from "@/lib/server/workspace-snapshot";

export async function GET(request: Request) {
  const proxied = await proxyApiRequest(request, "/api/channels");
  if (proxied) return proxied;

  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  try {
    const snapshot = await getWorkspaceSnapshot();
    return NextResponse.json({ ok: true, channels: snapshot.channels });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not load channels.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  const proxied = await proxyApiRequest(request, "/api/channels");
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
  const result = await createChannelRecord(parseChannelFormData(formData));
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  revalidatePath("/");
  return NextResponse.json(result);
}
