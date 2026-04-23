import path from "node:path";
import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { proxyApiRequest } from "@/lib/server/api-proxy";
import {
  deleteStoredFile,
  readStoredFile,
  updateStoredFileContent,
} from "@/lib/server/files";

function contentDisposition(fileName: string, asAttachment: boolean) {
  const mode = asAttachment ? "attachment" : "inline";
  return `${mode}; filename="${fileName.replace(/"/g, "")}"`;
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const proxied = await proxyApiRequest(request, `/api/files/${id}`);
  if (proxied) return proxied;

  const { searchParams } = new URL(request.url);
  const download = searchParams.get("download") === "1";
  const result = await readStoredFile(id);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  const ext = path.extname(result.file.name).toLowerCase();
  const type =
    result.file.mime_type ||
    (ext === ".md" ? "text/markdown; charset=utf-8" : "application/octet-stream");

  return new NextResponse(result.bytes, {
    headers: {
      "content-type": type,
      "content-disposition": contentDisposition(result.file.name, download),
      "cache-control": "no-store",
    },
  });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const proxied = await proxyApiRequest(request, `/api/files/${id}`);
  if (proxied) return proxied;

  const body = (await request.json()) as { content?: string; mimeType?: string };
  const result = await updateStoredFileContent({
    id,
    content: body.content ?? "",
    mimeType: body.mimeType ?? "",
  });
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  revalidatePath("/");
  return NextResponse.json(result);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const proxied = await proxyApiRequest(request, `/api/files/${id}`);
  if (proxied) return proxied;

  const result = await deleteStoredFile(id);
  if (!result.ok) {
    return NextResponse.json(result, { status: 400 });
  }
  revalidatePath("/");
  return NextResponse.json(result);
}
