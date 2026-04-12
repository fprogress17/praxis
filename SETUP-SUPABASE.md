# Supabase setup for Praxis web

After you **sign up** and create a **project**, you only need a few steps. **Do not paste keys into chat.**

## 1. Create the table and policies

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. Paste the full contents of **`supabase/migrations/001_channels.sql`** and click **Run**.

That creates the `channels` table and **Row Level Security** policies that allow the **anon** key to **select** and **insert** (fine for solo dev; tighten before any public launch).

## 2. Environment variables locally

1. In the dashboard: **Project Settings** → **API**.
2. Copy **Project URL** and the **`anon` `public`** key.
3. In `praxis-web`, copy `.env.example` to **`.env.local`** (gitignored).
4. Set:

   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key  

5. Restart `npm run dev` after changing env.

## 3. What you do **not** need to share

- **`service_role`** key — server-only, never in the browser, never in AI chat.
- **Database password** — keep in the dashboard / password manager.

## 4. If save fails

- Confirm the SQL ran without errors.
- Confirm `.env.local` exists and vars match the dashboard (no stray quotes/spaces).
- Read the error shown in the UI; RLS messages usually mean the migration was not applied.
