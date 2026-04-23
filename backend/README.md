# Praxis Standalone Backend

Local-only HTTP server for the current Praxis API surface.

Default bind:
- `127.0.0.1:4001`

Run:

```bash
npm run backend:dev
```

Env:
- Reads `.env.local` automatically if present
- Requires `DATABASE_URL`
- Uses `FILE_STORAGE_ROOT` when set, otherwise `local-storage/praxis-files`

Quick checks:

```bash
curl http://127.0.0.1:4001/health
curl http://127.0.0.1:4001/api/bootstrap
```

Current purpose:
- safe first standalone-backend checkpoint
- serves the same API surface as the Next route handlers
- does not change the frontend runtime yet
