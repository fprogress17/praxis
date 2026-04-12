# Praxis — Stack (living)

*Last updated: 2026-04-12*

Goal: **speed and low friction**. Stack can change when something else is faster — this file is the **current default**, not a religion.

---

## Current default

| Layer | Choice | Notes |
|--------|--------|--------|
| **App** | **Next.js** (App Router) | Fast path with Vercel; Supabase docs and examples align well. Swap later if needed. |
| **UI** | **React**, **Tailwind CSS** | Match Marginalia-style tokens (light-first, later light/dark/system) when implementing. |
| **Backend** | **Supabase** | Postgres + Auth + RLS + dashboard + JS/Swift SDKs; minimal glue for multi-device. |
| **Rich text** | **Lexical** | See [EDITOR.md](./EDITOR.md). |
| **Hosting (typical)** | **Vercel** (Next) | Same account flow many tutorials assume; not mandatory forever. |

---

## Supabase — what you do locally

1. **Sign up** at [supabase.com](https://supabase.com) and create a **project** (pick region, set a DB password — store it safely).
2. In the dashboard: **Project Settings → API**:
   - **Project URL** — public base URL for the API.
   - **`anon` `public` key** — safe to use in **browser** code **only** together with **Row Level Security (RLS)** policies you define. Still treat it as “public” and don’t email it randomly; you normally do **not** paste it into chat with strangers.
   - **`service_role` key** — **server-only**, bypasses RLS. **Never** put it in frontend code, **never** commit it, **never** paste it into AI chat.

3. In your app repo (when scaffolded), use **environment variables** — e.g. for Next:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

   Put real values in **`.env.local`** (gitignored). Commit only **`.env.example`** with empty placeholders.

---

## Do you need to give the AI your API keys?

**No.** For security and habit:

- **Do not** paste **any** Supabase secret (`service_role`) or your **database password** into Cursor or any chat.
- **Avoid** pasting even the **`anon`** key unless there is a rare debugging need; instead, describe errors or use redacted placeholders.

If something breaks, share **error messages**, **RLS policy SQL** (no secrets), and **which env var names** you set — not the key values.

---

## Changing the stack later

Document swaps here (e.g. move auth to Clerk, DB to Neon) when/if speed or constraints change. **Migrations** and **export** from Supabase remain possible because the data model stays **relational** under the hood.

---

## First-time Supabase

See **[SETUP-SUPABASE.md](./SETUP-SUPABASE.md)** and run **`supabase/migrations/001_channels.sql`** in the SQL Editor.

---

## Related docs

- [REQUIREMENTS_AND_DECISIONS.md](./REQUIREMENTS_AND_DECISIONS.md)
- [EDITOR.md](./EDITOR.md)
- [instruction.md](./instruction.md)
- [workLog.md](./workLog.md)
