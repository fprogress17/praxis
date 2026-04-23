import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import { dbConfigured } from "@/lib/server/db";
import { updateChannelOrder } from "@/lib/server/channels";

type RequestBody = {
  orderedIds?: unknown;
};

export async function PATCH(request: Request) {
  const proxied = await proxyApiRequest(request, "/api/channels/order");
  if (proxied) return proxied;

  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as RequestBody;
  const orderedIds = Array.isArray(body.orderedIds)
    ? body.orderedIds.filter((value): value is string => typeof value === "string")
    : [];

  if (orderedIds.length === 0) {
    return NextResponse.json(
      { ok: false, error: "orderedIds must be a non-empty string array." },
      { status: 400 },
    );
  }

  try {
    await updateChannelOrder(orderedIds);
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not reorder channels.",
      },
      { status: 500 },
    );
  }

  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
