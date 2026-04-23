# Praxis (browser-first)

This folder is the **web client** for **Praxis** — a **YouTube channel creation workspace** (channels, videos, notes, future AI). Identity and roadmap: [PRODUCT_IDENTITY.md](./PRODUCT_IDENTITY.md).

## Docs in this folder

| File | Purpose |
|------|---------|
| [PRODUCT_IDENTITY.md](./PRODUCT_IDENTITY.md) | **What Praxis is now** (YouTube creation focus), history, roadmap, AI-tab direction |
| [REQUIREMENTS_AND_DECISIONS.md](./REQUIREMENTS_AND_DECISIONS.md) | Product priorities, constraints, and how choices were made vs alternatives |
| [EDITOR.md](./EDITOR.md) | Editor choice (Lexical) and persistence strategy (remote-first vs local JSON) |
| [STACK.md](./STACK.md) | Current runtime stack (Next, local Postgres, local file storage, Tailwind, Lexical) |
| [LOCAL_POSTGRES_MIGRATION.md](./LOCAL_POSTGRES_MIGRATION.md) | Local Postgres schema, import/export, and cutover notes |
| [SETUP-SUPABASE.md](./SETUP-SUPABASE.md) | Legacy hosted-Supabase setup and migration source reference |
| [workLog.md](./workLog.md) | Dated log of code/doc changes (newest first) — see `instruction.md` |
| `instruction.md` | Git / work-log expectations; your run/setup notes |

## Sibling project

- **`../Praxis_Swift/`** — earlier native SwiftUI + SwiftData exploration; kept for reference, not the active path for this iteration.

## Run locally

```bash
cd praxis-web
npm install
cp .env.example .env.local
# Edit .env.local — set DATABASE_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Split Runtime Dev

```bash
npm run backend:start
npm run dev:split -- 3003
```

Open [http://localhost:3003](http://localhost:3003).

Check or stop the backend:

```bash
npm run backend:status
npm run backend:stop
```

## Desktop Runtime Contract

Production-style local runtime for a future packaged shell:

```bash
npm run build
npm run desktop:runtime:start
npm run desktop:runtime:status
npm run desktop:runtime:stop
```

Smoke check:

```bash
npm run smoke:desktop-runtime
```

## Desktop Shell Dev

```bash
npm run desktop:dev
```

This now targets the packaged-style local runtime:

- backend on `127.0.0.1:4001`
- production Next frontend on `127.0.0.1:3007`
- native Tauri window on top

Legacy split-runtime shell remains available:

```bash
npm run desktop:dev:split
```

Native-managed shell path for packaging prep:

```bash
npm run desktop:dev:native
```

That path still uses the same `3007` runtime target, but lets the Rust app start the backend/frontend itself via `PRAXIS_DESKTOP_MANAGED_RUNTIME=1` instead of relying on the outer shell script.

Packaging prep inside the Tauri app itself now exists too: `src-tauri/src/runtime.rs` contains a native-managed runtime scaffold behind `PRAXIS_DESKTOP_MANAGED_RUNTIME=1`, so packaged startup no longer has to begin as shell-script-only logic.

## Next step

Keep **UI** and **data** boundaries clean so a **Tauri** shell can wrap the same app later. See [STACK.md](./STACK.md) and [LOCAL_POSTGRES_MIGRATION.md](./LOCAL_POSTGRES_MIGRATION.md).
