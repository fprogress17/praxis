# Supabase setup for Praxis web

After you **sign up** and create a **project**, you only need a few steps. **Do not paste keys into chat.**

## 1. Create the table and policies

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. On your **computer**, open the file **`praxis-web/supabase/migrations/001_channels.sql`** in an editor, **select all the SQL** (the `create table …` block), **copy it**, and **paste that into the Supabase SQL Editor**.
4. Click **Run**.

**Important:** The SQL editor runs **SQL text only**. If you paste something like `supabase/migrations/001_channels.sql` (a path), you will get a **syntax error** — that is not SQL.

That creates the `channels` table and **Row Level Security** policies that allow the **anon** / **publishable** client key to **select** and **insert** (fine for solo dev; tighten before any public launch).

## 2. Environment variables locally

1. In the dashboard: **Project Settings** (gear) → **API** (or **Data API** / **API keys**, depending on dashboard version).
2. Copy:
   - **Project URL** (sometimes labeled **URL** next to the project).
   - The **browser-safe public client key**:
     - Older UI: **`anon` `public`**.
     - Newer UI: often **Publishable key** / **default publishable key** (same role: public client + RLS — **not** the `service_role` / **secret** key).
3. In `praxis-web`, copy `.env.example` to **`.env.local`** (gitignored).
4. Set **exact variable names** (Praxis code expects these names):

   - `NEXT_PUBLIC_SUPABASE_URL` = your **Project URL**  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = that **publishable / anon public** key  

   The env name stays `…ANON_KEY` even if the dashboard says “Publishable” — it is the same slot in our app.

5. No quotes around values unless your host requires them (usually **no** quotes).
6. Restart `npm run dev` after changing env.

### Do **not** use for `.env.local`

- **`service_role`** / **Secret** key — bypasses RLS; only for trusted server code, never `NEXT_PUBLIC_*`.

## 3. What you do **not** need to share

- **`service_role`** key — server-only, never in the browser, never in AI chat.
- **Database password** — keep in the dashboard / password manager.

## 4. If save fails

- Confirm the SQL ran without errors.
- Confirm `.env.local` exists and vars match the dashboard (no stray quotes/spaces).
- Read the error shown in the UI; RLS messages usually mean the migration was not applied.
