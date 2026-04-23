import { NextResponse } from "next/server";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import { dbConfigured } from "@/lib/server/db";
import { getWorkspaceSnapshot } from "@/lib/server/workspace-snapshot";

export async function GET(request: Request) {
  const proxied = await proxyApiRequest(request, "/api/bootstrap");
  if (proxied) return proxied;

  if (!dbConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        error: "DATABASE_URL is not configured.",
      },
      { status: 500 },
    );
  }

  try {
    const snapshot = await getWorkspaceSnapshot();
    return NextResponse.json({ ok: true, ...snapshot });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not load workspace snapshot.",
      },
      { status: 500 },
    );
  }
}
