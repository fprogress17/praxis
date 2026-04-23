import { NextResponse } from "next/server";
import type { ScriptType } from "@/lib/types/script-version";
import { dbConfigured } from "@/lib/server/db";
import {
  listVideoScriptVersions,
  saveVideoScriptVersion,
} from "@/lib/server/script-versions";

type RouteContext = {
  params: Promise<{ id: string }>;
};

function isScriptType(value: unknown): value is ScriptType {
  return value === "script" || value === "tts_script";
}

export async function GET(_request: Request, context: RouteContext) {
  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const { id } = await context.params;

  try {
    const versions = await listVideoScriptVersions(id);
    return NextResponse.json({ ok: true, versions });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Could not load script versions.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request, context: RouteContext) {
  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const { id } = await context.params;
  const body = (await request.json()) as {
    scriptType?: unknown;
    body?: unknown;
  };

  if (!isScriptType(body.scriptType)) {
    return NextResponse.json(
      { ok: false, error: "scriptType must be 'script' or 'tts_script'." },
      { status: 400 },
    );
  }

  const result = await saveVideoScriptVersion(
    id,
    body.scriptType,
    typeof body.body === "string" ? body.body : "",
  );
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }

  return NextResponse.json(result);
}
