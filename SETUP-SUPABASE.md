# Supabase setup for Praxis web

After you **sign up** and create a **project**, you only need a few steps. **Do not paste keys into chat.**

## 1. Create the table and policies

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project.
2. Go to **SQL Editor** → **New query**.
3. On your **computer**, open each migration in order, **copy the full SQL**, paste into the Supabase SQL Editor, and **Run**:
   - **`supabase/migrations/001_channels.sql`** — channels
   - **`supabase/migrations/002_videos.sql`** — videos linked to channels (needed for **Add video**)
   - **`supabase/migrations/003_videos_brief.sql`** — only if you already ran an older `002` without `brief`; fresh `002` includes `brief`
   - **`supabase/migrations/004_videos_update_policy.sql`** — allows **editing** saved videos (UPDATE + RLS); run if **Save changes** on edit fails with a permission / RLS error

**Important:** The SQL editor runs **SQL text only**. If you paste a **file path** instead of the file **contents**, you will get a **syntax error**.

That creates tables and **Row Level Security** policies so the **anon** / **publishable** client key can **select** and **insert** (fine for solo dev; tighten before any public launch).

### Optional — Supabase CLI (installed in this repo)

The **Supabase CLI** is a dev dependency. You can apply migrations from the terminal **after** linking your hosted project (needs **your** login — nothing in this repo can push to your cloud DB without that).

```bash
cd praxis-web
npm run supabase -- --version
npx supabase login
npx supabase link --project-ref YOUR_PROJECT_REF
npm run db:push
```

- **Project ref:** Dashboard URL is like `https://supabase.com/dashboard/project/<project_ref>` (also under **Project Settings → General**).
- **`db:push`** applies SQL files under **`supabase/migrations/`** that the linked database has not applied yet.

**If you already ran migrations manually in the SQL Editor** (e.g. `001` only), history may not match the CLI. Easiest fix for a missing **`videos`** table: still **paste and run `002_videos.sql`** in the **SQL Editor**. Aligning CLI history with a half-manual DB is possible but more steps (see [Supabase migration docs](https://supabase.com/docs/guides/cli/managing-environments)).

**Why the assistant can’t “run SQL on your side” for your project:** your database password and account live only in Supabase. This environment has no access to your hosted Postgres unless **you** run `supabase link` (or paste SQL in the dashboard).

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

### “Could not find the table `public.videos` in the schema cache”

That means the **`videos` table is not in your project** (you have not run **`002_videos.sql`**) **or** the API cache has not picked up a table you just created.

1. **Table Editor** (Supabase sidebar): check whether **`videos`** exists. If not, open **`supabase/migrations/002_videos.sql`** locally, copy **all** SQL, run it in **SQL Editor**.
2. If the table **is** listed but the app still errors, wait a short time and try again, or check **Project Settings → API** for a schema reload option (wording varies by dashboard version).
3. Then run **`004_videos_update_policy.sql`** when you need **edit / Save changes** on a video.
