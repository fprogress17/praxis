import http, { type IncomingMessage, type ServerResponse } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { dbConfigured } from "../lib/server/db.ts";
import { getWorkspaceSnapshot } from "../lib/server/workspace-snapshot.ts";
import {
  createChannelRecord,
  parseChannelFormData,
  updateChannelOrder,
} from "../lib/server/channels.ts";
import {
  createVideoRecord,
  deleteVideoRecord,
  parseVideoFormData,
  updateVideoRecord,
} from "../lib/server/videos.ts";
import {
  listVideoScriptVersions,
  saveVideoScriptVersion,
} from "../lib/server/script-versions.ts";
import {
  createNoteRecord,
  createWorkspaceNoteRecord,
  deleteNoteRecord,
  deleteWorkspaceNoteRecord,
  parseNoteFormData,
  parseWorkspaceNoteFormData,
  updateNoteRecord,
  updateWorkspaceNoteRecord,
} from "../lib/server/notes.ts";
import {
  createLinkRecord,
  deleteLinkRecord,
  parseLinkFormData,
  updateLinkRecord,
} from "../lib/server/links.ts";
import {
  deleteStoredFile,
  parseScope,
  readStoredFile,
  updateStoredFileContent,
  uploadStorageFiles,
} from "../lib/server/files.ts";
import {
  createIdeaRecord,
  createWorkspaceIdeaRecord,
  deleteIdeaRecord,
  deleteWorkspaceIdeaRecord,
  parseIdeaFormData,
  parseWorkspaceIdeaFormData,
  updateIdeaRecord,
  updateWorkspaceIdeaRecord,
} from "../lib/server/ideas.ts";
import type { ScriptType } from "../lib/types/script-version.ts";

const host = process.env.PRAxis_BACKEND_HOST ?? process.env.PRAXIS_BACKEND_HOST ?? "127.0.0.1";
const port = Number(process.env.PRAXIS_BACKEND_PORT ?? "4001");
const envPath = path.join(process.cwd(), ".env.local");

type RouteContext = {
  req: IncomingMessage;
  url: URL;
  params: Record<string, string>;
};

type RouteHandler = (context: RouteContext) => Promise<Response>;

type Route = {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
};

function allowedOrigins() {
  const raw = process.env.PRAXIS_ALLOWED_ORIGINS?.trim();
  if (!raw) {
    return new Set([
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:3002",
      "http://127.0.0.1:3002",
    ]);
  }

  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function corsHeaders(origin: string | null) {
  if (!origin) return {} as Record<string, string>;
  if (!allowedOrigins().has(origin)) return {} as Record<string, string>;
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin",
  } satisfies Record<string, string>;
}

function parseEnv(text: string) {
  const values: Record<string, string> = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

async function loadLocalEnv() {
  try {
    const text = await fs.readFile(envPath, "utf8");
    const parsed = parseEnv(text);
    for (const [key, value] of Object.entries(parsed)) {
      if (!(key in process.env)) {
        process.env[key] = value;
      }
    }
  } catch {
    // Ignore missing .env.local and rely on shell env.
  }
}

function json(data: unknown, init: ResponseInit = {}) {
  return Response.json(data, init);
}

function route(method: string, pathPattern: string, handler: RouteHandler): Route {
  const paramNames: string[] = [];
  const pattern = new RegExp(
    `^${pathPattern.replace(/:[^/]+/g, (segment) => {
      paramNames.push(segment.slice(1));
      return "([^/]+)";
    })}$`,
  );
  return { method, pattern, paramNames, handler };
}

function matchRoute(method: string, pathname: string, routes: Route[]) {
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

async function toWebRequest(req: IncomingMessage, url: URL) {
  const method = req.method ?? "GET";
  if (method === "GET" || method === "HEAD") {
    return new Request(url, { method, headers: req.headers as HeadersInit });
  }

  return new Request(url, {
    method,
    headers: req.headers as HeadersInit,
    body: Readable.toWeb(req) as ReadableStream,
    duplex: "half",
  } as RequestInit);
}

async function sendWebResponse(nodeRes: ServerResponse, webRes: Response) {
  nodeRes.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value);
  });

  if (webRes.body == null) {
    nodeRes.end();
    return;
  }

  const bytes = Buffer.from(await webRes.arrayBuffer());
  nodeRes.end(bytes);
}

async function parseJsonBody<T>(req: IncomingMessage, url: URL) {
  const request = await toWebRequest(req, url);
  return (await request.json()) as T;
}

async function parseFormData(req: IncomingMessage, url: URL) {
  const request = await toWebRequest(req, url);
  return request.formData();
}

function contentDisposition(fileName: string, asAttachment: boolean) {
  const mode = asAttachment ? "attachment" : "inline";
  return `${mode}; filename="${fileName.replace(/"/g, "")}"`;
}

function isScriptType(value: unknown): value is ScriptType {
  return value === "script" || value === "tts_script";
}

const routes: Route[] = [
  route("GET", "/health", async () =>
    json({
      ok: true,
      service: "praxis-backend",
      host,
      port,
      dataConfigured: dbConfigured(),
      timestamp: new Date().toISOString(),
    })),

  route("GET", "/api/bootstrap", async () => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }

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
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }

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

  route("POST", "/api/channels", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const formData = await parseFormData(req, url);
    const result = await createChannelRecord(parseChannelFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/channels/order", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ orderedIds?: unknown }>(req, url);
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

  route("POST", "/api/videos", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const formData = await parseFormData(req, url);
    const result = await createVideoRecord(parseVideoFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/videos/:id", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const formData = await parseFormData(req, url);
    formData.set("id", params.id);
    const result = await updateVideoRecord(parseVideoFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/videos/:id", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await deleteVideoRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("GET", "/api/videos/:id/script-versions", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
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

  route("POST", "/api/videos/:id/script-versions", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ scriptType?: unknown; body?: unknown }>(req, url);
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

  route("POST", "/api/notes", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ channelId?: string; videoId?: string | null; title?: string; body?: string }>(req, url);
    const formData = new FormData();
    formData.set("channel_id", body.channelId ?? "");
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    if (body.videoId) formData.set("video_id", body.videoId);
    const result = await createNoteRecord(parseNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/notes/:id", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ title?: string; body?: string }>(req, url);
    const formData = new FormData();
    formData.set("id", params.id);
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    const result = await updateNoteRecord(parseNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/notes/:id", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await deleteNoteRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/workspace-notes", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ title?: string; body?: string }>(req, url);
    const formData = new FormData();
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    const result = await createWorkspaceNoteRecord(parseWorkspaceNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/workspace-notes/:id", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ title?: string; body?: string }>(req, url);
    const formData = new FormData();
    formData.set("id", params.id);
    formData.set("title", body.title ?? "");
    formData.set("body", body.body ?? "");
    const result = await updateWorkspaceNoteRecord(parseWorkspaceNoteFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/workspace-notes/:id", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await deleteWorkspaceNoteRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/links", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{
      channelId?: string | null;
      videoId?: string | null;
      title?: string;
      url?: string;
      note?: string;
    }>(req, url);
    const formData = new FormData();
    if (body.channelId) formData.set("channel_id", body.channelId);
    if (body.videoId) formData.set("video_id", body.videoId);
    formData.set("title", body.title ?? "");
    formData.set("url", body.url ?? "");
    formData.set("note", body.note ?? "");
    const result = await createLinkRecord(parseLinkFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/links/:id", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ title?: string; url?: string; note?: string }>(req, url);
    const formData = new FormData();
    formData.set("id", params.id);
    formData.set("title", body.title ?? "");
    formData.set("url", body.url ?? "");
    formData.set("note", body.note ?? "");
    const result = await updateLinkRecord(parseLinkFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/links/:id", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await deleteLinkRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/files", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const formData = await parseFormData(req, url);
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);
    const result = await uploadStorageFiles({
      scope: parseScope(formData),
      channelId: String(formData.get("channel_id") ?? "").trim() || null,
      videoId: String(formData.get("video_id") ?? "").trim() || null,
      files,
    });
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("GET", "/api/files/:id", async ({ url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await readStoredFile(params.id);
    if (!result.ok) {
      return json({ error: result.error }, { status: 404 });
    }
    const download = url.searchParams.get("download") === "1";
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

  route("PATCH", "/api/files/:id", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ content?: string; mimeType?: string }>(req, url);
    const result = await updateStoredFileContent({
      id: params.id,
      content: body.content ?? "",
      mimeType: body.mimeType ?? "",
    });
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/files/:id", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await deleteStoredFile(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/ideas", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ channelId?: string; body?: string }>(req, url);
    const formData = new FormData();
    formData.set("channel_id", body.channelId ?? "");
    formData.set("body", body.body ?? "");
    const result = await createIdeaRecord(parseIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/ideas/:id", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ body?: string }>(req, url);
    const formData = new FormData();
    formData.set("idea_id", params.id);
    formData.set("body", body.body ?? "");
    const result = await updateIdeaRecord(parseIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/ideas/:id", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await deleteIdeaRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("POST", "/api/workspace-ideas", async ({ req, url }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ body?: string }>(req, url);
    const formData = new FormData();
    formData.set("body", body.body ?? "");
    const result = await createWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("PATCH", "/api/workspace-ideas/:id", async ({ req, url, params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const body = await parseJsonBody<{ body?: string }>(req, url);
    const formData = new FormData();
    formData.set("idea_id", params.id);
    formData.set("body", body.body ?? "");
    const result = await updateWorkspaceIdeaRecord(parseWorkspaceIdeaFormData(formData));
    return json(result, { status: result.ok ? 200 : 400 });
  }),

  route("DELETE", "/api/workspace-ideas/:id", async ({ params }) => {
    if (!dbConfigured()) {
      return json({ ok: false, error: "DATABASE_URL is not configured." }, { status: 500 });
    }
    const result = await deleteWorkspaceIdeaRecord(params.id);
    return json(result, { status: result.ok ? 200 : 400 });
  }),
];

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? `${host}:${port}`}`);
  const method = req.method ?? "GET";
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : null;

  if (method === "OPTIONS") {
    await sendWebResponse(
      res,
      new Response(null, {
        status: 204,
        headers: {
          allow: "GET,POST,PATCH,DELETE,OPTIONS",
          ...corsHeaders(origin),
        },
      }),
    );
    return;
  }

  const match = matchRoute(method, url.pathname, routes);
  if (!match) {
    await sendWebResponse(res, json({ ok: false, error: "Not found." }, { status: 404 }));
    return;
  }

  try {
    const response = await match.handler({ req, url, params: match.params });
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(corsHeaders(origin))) {
      headers.set(key, value);
    }
    await sendWebResponse(res, new Response(response.body, { status: response.status, headers }));
  } catch (error) {
    await sendWebResponse(
      res,
      json(
        { ok: false, error: error instanceof Error ? error.message : "Internal server error." },
        { status: 500, headers: corsHeaders(origin) },
      ),
    );
  }
});

await loadLocalEnv();

server.listen(port, host, () => {
  console.log(`Praxis backend listening on http://${host}:${port}`);
});
