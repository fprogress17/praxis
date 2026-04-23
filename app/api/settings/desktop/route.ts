import { NextResponse } from "next/server";
import { getDesktopLanStatus, writeDesktopSettings } from "@/lib/server/desktop-settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const status = await getDesktopLanStatus();
  return NextResponse.json({ ok: true, ...status });
}

export async function PUT(request: Request) {
  const body = (await request.json()) as { shareOnLocalNetwork?: boolean };
  if (typeof body.shareOnLocalNetwork !== "boolean") {
    return NextResponse.json(
      { ok: false, error: "shareOnLocalNetwork must be a boolean." },
      { status: 400 },
    );
  }

  await writeDesktopSettings({ shareOnLocalNetwork: body.shareOnLocalNetwork });
  const status = await getDesktopLanStatus();
  return NextResponse.json({
    ok: true,
    ...status,
    restartRequired: true,
  });
}
