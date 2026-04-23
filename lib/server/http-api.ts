import path from "node:path";
import { dbConfigured } from "@/lib/server/db";
import { getWorkspaceSnapshot } from "@/lib/server/workspace-snapshot";
import {
  createChannelRecord,
  parseChannelFormData,
  updateChannelOrder,
} from "@/lib/server/channels";
import {
  createVideoRecord,
  deleteVideoRecord,
  parseVideoFormData,
  updateVideoRecord,
} from "@/lib/server/videos";
import {
  listVideoScriptVersions,
  saveVideoScriptVersion,
} from "@/lib/server/script-versions";
import {
  createNoteRecord,
  createWorkspaceNoteRecord,
  deleteNoteRecord,
  deleteWorkspaceNoteRecord,
  parseNoteFormData,
  parseWorkspaceNoteFormData,
  updateNoteRecord,
  updateWorkspaceNoteRecord,
} from "@/lib/server/notes";
import {
  createLinkRecord,
  deleteLinkRecord,
  parseLinkFormData,
  updateLinkRecord,
} from "@/lib/server/links";
import {
  deleteStoredFile,
  parseScope,
  readStoredFile,
  updateStoredFileContent,
  uploadStorageFiles,
} from "@/lib/server/files";
import {
  createIdeaRecord,
  createWorkspaceIdeaRecord,
  deleteIdeaRecord,
  deleteWorkspaceIdeaRecord,
  parseIdeaFormData,
  parseWorkspaceIdeaFormData,
  updateIdeaRecord,
  updateWorkspaceIdeaRecord,
} from "@/lib/server/ideas";
import type { ScriptType } from "@/lib/types/script-version";

type ApiRouteHandler = (request: Request, params: Record<string, string>) => Promise<Response>;

type ApiRoute = {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: ApiRouteHandler;
};

function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, init);
}

function route(method: string, pathPattern: string, handler: ApiRouteHandler): ApiRoute {
  const paramNames: string[] = [];
  const pattern = new RegExp(
    `^${pathPattern.replace(/:[^/]+/g, (segment) => {
      paramNames.push(segment.slice(1));
      return "([^/]+)";
    })}$`,
  );
  return { method, pattern, paramNames, handler };
}

function missingDatabaseResponse() {
  return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
}

function contentDisposition(fileName: string, asAttachment: boolean) {
  const mode = asAttachment ? "attachment" : "inline";
  return `${mode}; filename="${fileName.replace(/"/g, "")}"`;
}

function isScriptType(value: unknown): value is ScriptType {
  return value === "script" || value === "tts_script";
}

function matchRoute(method: string, pathname: string, routes: ApiRoute[]) {
  for (const candidate of routes) {
    if (candidate.method !== method) continue;
    const match = pathname.match(candidate.pattern);
    if (!match) continue;
    const params = Object.fromEntries(
      candidate.paramNames.map((name, index) => [name, decodeURIComponent(match[index + 1] ?? "")]),
    );
    return { handler: candidate.handler, params };
  }
  return null;
}

async function parseJsonBody<T>(request: Request) {
  return (await request.json()) as T;
}

async function parseMultipartFormData(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return null;
  }
  return request.formData();
}

const routes: ApiRoute[] = [
  route("GET", "/health", async () =>
    json({
      ok: true,
      service: "praxis-backend",
      dataConfigured: dbConfigured(),
      timestamp: new Date().toISOString(),
    })),

  route("GET", "/api/bootstrap", async () => {
    if (!dbConfigured()) return missingDatabaseResponse();

    try {
      const snapshot = await getWorkspaceSnapshot();
      return json({ ok: true, ...snapshot });
    } catch (error) {
      return json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Could not load workspace snapshot.",
        },
        { status: 500 },
      );
    }
  }),

  route("GET", "/api/channels", async () => {
    if (!dbConfigured()) return missingDatabaseResponse();

    try {
      const snapshot = await getWorkspaceSnapshot();
      return json({ ok: true, channels: snapshot.channels });
    } catch (error) {
      return json(
        { ok: false, error: error instanceof Error ? error.message : "Could not load channels." },
        { status: 500 },
      );
    }
  }),

  route("POST", "/api/channels", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const formData = await parseMultipartFormData(request);
    if (!formData) {
      return json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
    }

    const result = await createChannelRecord(parseChannelFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/channels/order", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ orderedIds?: unknown }>(request);
    const orderedIds = Array.isArray(body.orderedIds)
      ? body.orderedIds.filter((value): value is string => typeof value === "string")
      : [];

    if (orderedIds.length === 0) {
      return json(
        { ok: false, error: "orderedIds must be a non-empty string array." },
        { status: 400 },
      );
    }

    try {
      await updateChannelOrder(orderedIds);
      return json({ ok: true });
    } catch (error) {
      return json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Could not reorder channels.",
        },
        { status: 500 },
      );
    }
  }),

  route("POST", "/api/videos", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const formData = await parseMultipartFormData(request);
    if (!formData) {
      return json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
    }

    const result = await createVideoRecord(parseVideoFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/videos/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const formData = await parseMultipartFormData(request);
    if (!formData) {
      return json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
    }

    formData.set("id", params.id);
    const result = await updateVideoRecord(parseVideoFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/videos/:id", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await deleteVideoRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("GET", "/api/videos/:id/script-versions", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    try {
      const versions = await listVideoScriptVersions(params.id);
      return json({ ok: true, versions });
    } catch (error) {
      return json(
        {
          ok: false,
          error: error instanceof Error ? error.message : "Could not load script versions.",
        },
        { status: 500 },
      );
    }
  }),

  route("POST", "/api/videos/:id/script-versions", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ scriptType?: unknown; body?: unknown }>(request);
    if (!isScriptType(body.scriptType)) {
      return json(
        { ok: false, error: "scriptType must be 'script' or 'tts_script'." },
        { status: 400 },
      );
    }

    const result = await saveVideoScriptVersion(
      params.id,
      body.scriptType,
      typeof body.body === "string" ? body.body : "",
    );
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/notes", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{
      channelId?: string;
      videoId?: string | null;
      title?: string;
      body?: string;
    }>(request);
    const formData = new FormData();
    formData.set("channel_id", body.channelId ?? "");
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    if (body.videoId) formData.set("video_id", body.videoId);

    const result = await createNoteRecord(parseNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/notes/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ title?: string; body?: string }>(request);
    const formData = new FormData();
    formData.set("id", params.id);
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    const result = await updateNoteRecord(parseNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/notes/:id", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await deleteNoteRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/workspace-notes", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ title?: string; body?: string }>(request);
    const formData = new FormData();
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    const result = await createWorkspaceNoteRecord(parseWorkspaceNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/workspace-notes/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ title?: string; body?: string }>(request);
    const formData = new FormData();
    formData.set("id", params.id);
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    const result = await updateWorkspaceNoteRecord(parseWorkspaceNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/workspace-notes/:id", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await deleteWorkspaceNoteRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/links", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{
      channelId?: string | null;
      videoId?: string | null;
      title?: string;
      url?: string;
      note?: string;
    }>(request);
    const formData = new FormData();
    if (body.channelId) formData.set("channel_id", body.channelId);
    if (body.videoId) formData.set("video_id", body.videoId);
    formData.set("title", body.title ?? "");
    formData.set("url", body.url ?? "");
    formData.set("note", body.note ?? "");

    const result = await createLinkRecord(parseLinkFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/links/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ title?: string; url?: string; note?: string }>(request);
    const formData = new FormData();
    formData.set("id", params.id);
    formData.set("title", body.title ?? "");
    formData.set("url", body.url ?? "");
    formData.set("note", body.note ?? "");
    const result = await updateLinkRecord(parseLinkFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/links/:id", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await deleteLinkRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/files", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const formData = await parseMultipartFormData(request);
    if (!formData) {
      return json({ ok: false, error: "Expected multipart form data." }, { status: 400 });
    }

    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    const result = await uploadStorageFiles({
      scope: parseScope(formData),
      channelId: String(formData.get("channel_id") ?? "").trim() || null,
      videoId: String(formData.get("video_id") ?? "").trim() || null,
      files,
    });
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("GET", "/api/files/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await readStoredFile(params.id);
    if (!result.ok) {
      return json({ error: result.error }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const download = searchParams.get("download") === "1";
    const ext = path.extname(result.file.name).toLowerCase();
    const type =
      result.file.mime_type ||
      (ext === ".md" ? "text/markdown; charset=utf-8" : "application/octet-stream");

    return new Response(result.bytes, {
      headers: {
        "content-type": type,
        "content-disposition": contentDisposition(result.file.name, download),
        "cache-control": "no-store",
      },
    });
  }),

  route("PATCH", "/api/files/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ content?: string; mimeType?: string }>(request);
    const result = await updateStoredFileContent({
      id: params.id,
      content: body.content ?? "",
      mimeType: body.mimeType ?? "",
    });
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/files/:id", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await deleteStoredFile(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/ideas", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ channelId?: string; body?: string }>(request);
    const formData = new FormData();
    formData.set("channel_id", body.channelId ?? "");
    formData.set("body", body.body ?? "");
    const result = await createIdeaRecord(parseIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/ideas/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ body?: string }>(request);
    const formData = new FormData();
    formData.set("idea_id", params.id);
    formData.set("body", body.body ?? "");
    const result = await updateIdeaRecord(parseIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/ideas/:id", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await deleteIdeaRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/workspace-ideas", async (request) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ body?: string }>(request);
    const formData = new FormData();
    formData.set("body", body.body ?? "");
    const result = await createWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/workspace-ideas/:id", async (request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const body = await parseJsonBody<{ body?: string }>(request);
    const formData = new FormData();
    formData.set("idea_id", params.id);
    formData.set("body", body.body ?? "");
    const result = await updateWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/workspace-ideas/:id", async (_request, params) => {
    if (!dbConfigured()) return missingDatabaseResponse();

    const result = await deleteWorkspaceIdeaRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),
];

export async function dispatchApiRequest(request: Request, pathname: string) {
  const match = matchRoute(request.method, pathname, routes);
  if (!match) {
    return null;
  }

  try {
    return await match.handler(request, match.params);
  } catch (error) {
    return json(
      { ok: false, error: error instanceof Error ? error.message : "Internal server error." },
      { status: 500 },
    );
  }
}
