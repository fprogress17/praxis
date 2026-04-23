function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function publicApiBaseUrl() {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  return raw ? trimTrailingSlash(raw) : "";
}

export function serverApiBaseUrl() {
  const raw =
    process.env.PRAXIS_API_BASE_URL?.trim() || process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "";
  return raw ? trimTrailingSlash(raw) : "";
}

export function apiUrl(pathname: string) {
  const base = publicApiBaseUrl();
  return base ? `${base}${pathname}` : pathname;
}

export function serverApiUrl(pathname: string) {
  const base = serverApiBaseUrl();
  return base ? `${base}${pathname}` : pathname;
}
