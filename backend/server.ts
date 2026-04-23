import http, { type IncomingMessage, type ServerResponse } from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { dispatchApiRequest } from "../lib/server/http-api.ts";

const host = process.env.PRAxis_BACKEND_HOST ?? process.env.PRAXIS_BACKEND_HOST ?? "127.0.0.1";
const port = Number(process.env.PRAXIS_BACKEND_PORT ?? "4001");
const envPath = path.join(process.cwd(), ".env.local");

function allowedOrigins() {
  const raw = process.env.PRAXIS_ALLOWED_ORIGINS?.trim();
  if (!raw) return null;

  return new Set(
    raw
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean),
  );
}

function corsHeaders(origin: string | null) {
  if (!origin) return {} as Record<string, string>;
  const configured = allowedOrigins();
  const localDevOrigin = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
  const allowed = configured ? configured.has(origin) : localDevOrigin;
  if (!allowed) return {} as Record<string, string>;
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

  const request = await toWebRequest(req, url);
  const response = await dispatchApiRequest(request, url.pathname);
  if (!response) {
    await sendWebResponse(
      res,
      Response.json({ ok: false, error: "Not found." }, { status: 404 }),
    );
    return;
  }

  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(corsHeaders(origin))) {
    headers.set(key, value);
  }
  await sendWebResponse(res, new Response(response.body, { status: response.status, headers }));
});

await loadLocalEnv();

server.listen(port, host, () => {
  console.log(`Praxis backend listening on http://${host}:${port}`);
});
