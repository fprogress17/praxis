# Praxis — Stack (living)

*Last updated: 2026-04-22*

Goal: **speed and low friction**. Stack can change when something else is faster — this file is the **current default**, not a religion. Product identity: **[PRODUCT_IDENTITY.md](./PRODUCT_IDENTITY.md)** (YouTube channel creation workspace).

---

## Current default

| Layer | Choice | Notes |
|--------|--------|--------|
| **App** | **Next.js** (App Router) | Fast local iteration, straightforward server actions, easy API routes for local file serving. |
| **UI** | **React**, **Tailwind CSS** | Match Marginalia-style tokens (light-first, later light/dark/system) when implementing. |
| **Backend** | **Local Postgres** | Current runtime uses `pg` via a shared server data layer and `DATABASE_URL`. |
| **File storage** | **Local disk** | Current default is `local-storage/praxis-files` or `FILE_STORAGE_ROOT` if set. |
| **Rich text** | **Lexical** | See [EDITOR.md](./EDITOR.md). |
| **Desktop shell (early)** | **Tauri dev shell** | `src-tauri/` now wraps the packaged-style local runtime in development mode; packaging is not the target yet. |
| **Desktop runtime contract** | **Managed local backend + Next prod server** | `desktop:runtime:*` scripts now define the packaged-style local startup path. |
| **Hosting (typical)** | **Local-first** | Current setup is local runtime and local database; hosting can be revisited later. |

---

## Local runtime

1. Create or reuse a local Postgres database.
2. In `.env.local`, set:

   - `DATABASE_URL`
   - optional `FILE_STORAGE_ROOT`

3. Apply the local schema:

```bash
cd praxis-web
npm run db:local:apply
```

4. Start the app:

```bash
npm run dev
```

The default file storage root is `local-storage/praxis-files`.

---

## Migration source

Supabase is no longer the runtime backend, but the repo still includes:

- `supabase/migrations/`
- `SETUP-SUPABASE.md`
- export/download scripts that read from a configured Supabase project

Those exist to support staged migration and backup/import workflows, not the active runtime path.

---

## Changing the stack later

Document swaps here when/if speed or deployment constraints change. Current obvious future options:

- hosted Postgres instead of local Postgres
- S3-compatible object storage instead of local disk
- auth layer if the app stops being single-user/local-first

---

## First-time local setup

See **[LOCAL_POSTGRES_MIGRATION.md](./LOCAL_POSTGRES_MIGRATION.md)**.

---

## Related docs

- [REQUIREMENTS_AND_DECISIONS.md](./REQUIREMENTS_AND_DECISIONS.md)
- [EDITOR.md](./EDITOR.md)
- [instruction.md](./instruction.md)
- [workLog.md](./workLog.md)
