# Praxis Standalone Backend

Local-only HTTP server for the current Praxis API surface.

Default bind:
- `127.0.0.1:4001`

Run:

```bash
npm run backend:dev
```

Managed lifecycle:

```bash
npm run backend:start
npm run backend:status
npm run backend:stop
```

Split frontend against this backend:

```bash
npm run dev:split -- 3003
```

Optional frontend target:

```bash
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:4001
PRAXIS_API_BASE_URL=http://127.0.0.1:4001
```

Env:
- Reads `.env.local` automatically if present
- Requires `DATABASE_URL`
- Uses `FILE_STORAGE_ROOT` when set, otherwise `local-storage/praxis-files`
- Uses `PRAXIS_BACKEND_HOST` / `PRAXIS_BACKEND_PORT` for bind settings
- Uses `PRAXIS_BACKEND_CLIENT_HOST` to derive the local frontend/backend URL when the bind host differs from the client host
- Managed scripts write PID/log state under `.runtime/` by default

Quick checks:

```bash
curl http://127.0.0.1:4001/health
curl http://127.0.0.1:4001/api/bootstrap
npm run smoke:backend
```

Current purpose:
- safe first standalone-backend checkpoint
- serves the same API surface as the Next route handlers
- does not change the frontend runtime yet
- has a deterministic start/stop/status path for an eventual desktop shell
