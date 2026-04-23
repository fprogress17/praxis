import { serverApiBaseUrl, serverApiUrl } from "@/lib/api/url";

function filteredHeaders(headers: Headers) {
  const nextHeaders = new Headers();
  headers.forEach((value, key) => {
    const lower = key.toLowerCase();
    if (lower === "host" || lower === "content-length") return;
    nextHeaders.set(key, value);
  });
  return nextHeaders;
}

export function proxyEnabled() {
  return Boolean(serverApiBaseUrl());
}

export async function proxyApiRequest(request: Request, pathname: string) {
  if (!proxyEnabled()) {
    return null;
  }

  const incomingUrl = new URL(request.url);
  const targetUrl = serverApiUrl(`${pathname}${incomingUrl.search}`);
  const method = request.method.toUpperCase();
  const init: RequestInit = {
    method,
    headers: filteredHeaders(request.headers),
    cache: "no-store",
  };

  if (method !== "GET" && method !== "HEAD") {
    init.body = await request.arrayBuffer();
  }

  const upstream = await fetch(targetUrl, init);
  return new Response(upstream.body, {
    status: upstream.status,
    headers: upstream.headers,
  });
}
