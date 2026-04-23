import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { dbConfigured } from "@/lib/server/db";
import {
  createWorkspaceIdeaRecord,
  parseWorkspaceIdeaFormData,
} from "@/lib/server/ideas";

export async function POST(request: Request) {
  if (!dbConfigured()) {
    return NextResponse.json(
      { ok: false, error: "DATABASE_URL is not configured." },
      { status: 500 },
    );
  }

  const body = (await request.json()) as { body?: string };
  const formData = new FormData();
  formData.set("body", body.body ?? "");

  const result = await createWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
  if (!result.ok) return NextResponse.json(result, { status: 400 });
  revalidatePath("/");
  return NextResponse.json(result);
}
