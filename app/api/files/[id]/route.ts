import path from "node:path";
import { NextResponse } from "next/server";
import { query } from "@/lib/server/db";
import { readStorageObject } from "@/lib/server/storage";

type FileRecord = {
  id: string;
  name: string;
  mime_type: string;
  object_path: string;
};

function contentDisposition(fileName: string, asAttachment: boolean) {
  const mode = asAttachment ? "attachment" : "inline";
  return `${mode}; filename="${fileName.replace(/"/g, "")}"`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const { searchParams } = new URL(_request.url);
  const download = searchParams.get("download") === "1";

  const result = await query<FileRecord>(
    `select id, name, mime_type, object_path from public.files where id = $1 limit 1`,
    [id],
  );

  const file = result.rows[0];
  if (!file) {
    return NextResponse.json({ error: "File not found." }, { status: 404 });
  }

  try {
    const bytes = await readStorageObject(file.object_path);
    const ext = path.extname(file.name).toLowerCase();
    const type =
      file.mime_type ||
      (ext === ".md" ? "text/markdown; charset=utf-8" : "application/octet-stream");

    return new NextResponse(bytes, {
      headers: {
        "content-type": type,
        "content-disposition": contentDisposition(file.name, download),
        "cache-control": "no-store",
      },
    });
  } catch {
    return NextResponse.json({ error: "File content is missing on disk." }, { status: 404 });
  }
}
