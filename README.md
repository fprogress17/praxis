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
npm run backend:dev
npm run dev:split -- 3003
```

Open [http://localhost:3003](http://localhost:3003).

## Next step

Keep **UI** and **data** boundaries clean so a **Tauri** shell can wrap the same app later. See [STACK.md](./STACK.md) and [LOCAL_POSTGRES_MIGRATION.md](./LOCAL_POSTGRES_MIGRATION.md).
