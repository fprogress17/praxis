These files are archived compatibility wrappers from the earlier Next server-actions runtime.

They are kept as reference material only. The active runtime now uses:

- explicit `app/api/*` route handlers in Next
- shared request handling in `lib/server/http-api.ts`
- the standalone backend in `backend/server.ts`

Nothing in the live app imports this archive.
