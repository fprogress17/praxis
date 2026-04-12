# Praxis web — work log

Format: **newest at top**. Per `instruction.md`: date, time, commit (if any), brief explanation, cause, fix, agent name.

---

## 2026-04-12 — Idempotent SQL migrations (`db push` vs existing policies)

**Time:** (local)  
**Commit:** `95129fb`  
**What:** **`001`–`002`–`004`**: `drop policy if exists …` before `create policy` so **`npm run db:push`** succeeds when channels/policies were created manually; **SETUP-SUPABASE** troubleshooting for “policy already exists”.  
**Cause:** User’s push failed: `policy "channels_select_anon" … already exists`.  
**Fix / outcome:** Re-run **`db:push`** after pull.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Supabase CLI in repo + SETUP (cannot run remote SQL without user)

**Time:** (local)  
**Commit:** `750ebac`  
**What:** `supabase` devDependency; `npx supabase init` → **`supabase/config.toml`**; scripts `db:push` / `db:pull`; **`.gitignore`** `.supabase`; **SETUP-SUPABASE** optional CLI (`login` → `link` → `db:push`) and note that agent cannot execute on user’s hosted DB without credentials.  
**Cause:** User asked to install CLI and run SQL from assistant.  
**Fix / outcome:** Local CLI ready; user links once and `npm run db:push`, or keep using SQL Editor (e.g. run **`002_videos.sql`** — Table Editor still shows only `channels`).  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Clearer errors when `videos` table missing (schema cache)

**Time:** (local)  
**Commit:** `5471fc5`  
**What:** Map PostgREST **PGRST205** / “schema cache” / “could not find the table” to a single hint pointing at **`002_videos.sql`** (+ 003/004); **SETUP-SUPABASE** troubleshooting subsection for that error.  
**Cause:** User saw *Could not find the table public.videos in the schema cache* on save — usually **002** not run.  
**Fix / outcome:** Actionable in-app + doc copy.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Channel center: video list + tap → edit (collapse left panel)

**Time:** (local)  
**Commit:** `701d811`  
**What:** Home loads `videos`; **ChannelVideoList** under channel header; tap opens **edit-video** with **EditVideoForm** (title, brief, script) and collapses channels (same rail / mobile bar as new video). **`updateVideo`** server action; **`004_videos_update_policy.sql`** for UPDATE RLS; mobile collapsed bar subtitle **New video** / **Edit video**.  
**Cause:** User wanted saved videos visible in center and edit view with hidden left panel.  
**Fix / outcome:** List → edit flow; run `004` in Supabase if update denied.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Fix: unexpected server response (forms + home fetch)

**Time:** (local)  
**Commit:** `cea026d`  
**What:** Replaced `startTransition(async () => … server action)` with `useState` pending + `try/finally` in **NewVideoForm** and **NewChannelForm** (async inside `startTransition` breaks server-action / RSC flow in Next 15). Wrapped home `channels` fetch in **try/catch** and normalized rows to plain strings for safe RSC props.  
**Cause:** Runtime overlay *An unexpected response was received from the server* at `NewVideoForm` / refresh path.  
**Fix / outcome:** Stable submit + safer server render on Supabase errors.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Collapse channels panel on Add video + open rail / bar

**Time:** (local)  
**Commit:** `d69a5db`  
**What:** Tapping **Add video** closes desktop sidebar (`channelsPanelOpen`) and shows `ChannelsPanelRail` with **Open channels panel**; mobile swaps full `MobileNav` for `MobileChannelsCollapsedBar` with **Open channels**. **Cancel/Save** on new video restores panels via `endVideoFlow`. **New channel** forces panels open.  
**Cause:** User wanted left panel hidden during new video with explicit reopen control.  
**Fix / outcome:** More horizontal space for the form; reopen without leaving flow.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Video form: Brief between title and script

**Time:** (local)  
**Commit:** `449b75b`  
**What:** **Brief** textarea (3 rows) between video title and script; `videos.brief` in `createVideo`; `VideoRow.brief`; `002_videos.sql` includes `brief` for new installs; `003_videos_brief.sql` for existing DBs; SETUP note.  
**Cause:** User asked for brief section between title and script.  
**Fix / outcome:** Persist optional brief; existing projects run `003` once.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Channel card: Add video + center form + DB

**Time:** (local)  
**Commit:** `d002e52`  
**What:** `ChannelCard` (bordered card + **Add video**); `new-video` mode: center shows channel title/brief then **New video** form (title, script, save); `createVideo` server action; `002_videos.sql` migration; SETUP lists both migrations.  
**Cause:** User wanted in-card video action and form under channel title.  
**Fix / outcome:** Persist videos to `videos` table after SQL run.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Mobile: New channel visible below `lg`

**Time:** (local)  
**Commit:** `569979e`  
**What:** Added `MobileNav` (sticky top bar): **New channel**, compact theme toggle, collapsible **Channels** list. Shell is `flex-col` on small screens / `lg:flex-row` on large. `ThemeToggle` supports `compact` icon-only.  
**Cause:** Sidebar used `hidden lg:flex`, so **New channel** disappeared on viewports under 1024px.  
**Fix / outcome:** Primary actions available on phone/narrow windows; desktop unchanged.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — SETUP-SUPABASE: publishable key + SQL paste clarification

**Time:** (local)  
**Commit:** `75984ff`  
**What:** Documented that Supabase **Publishable** key maps to `NEXT_PUBLIC_SUPABASE_ANON_KEY`; warned not to paste file **path** into SQL Editor (must paste **file contents**).  
**Cause:** User could not find “anon public” label; SQL error from running path as query.  
**Fix / outcome:** Clearer dashboard wording and SQL steps in `SETUP-SUPABASE.md`.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Initial Next.js app + channels (see git commit)

**Time:** (local)  
**Commit:** `474d207`  
**What:** Scaffolded Next.js 15 + Tailwind 4 + Supabase client; Marginalia-style 3-column shell (sidebar 260px / center max 52rem / right 300px); **New channel** button → center form (title, category dropdown, brief note, save); server action `createChannel`; SQL migration `001_channels.sql`; theme cycle light/dark/system (`next-themes`); `SETUP-SUPABASE.md`, `.env.example`; `export const dynamic = 'force-dynamic'` on home page; `git init` in `praxis-web`.  
**Cause:** User requested first vertical slice matching mock: channels as top-level spaces + Supabase persistence path.  
**Fix / outcome:** Build passes (`npm run build`); list loads when env + SQL applied.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — STACK.md (no commit yet)

**Time:** (local)  
**Commit:** —  
**What:** Added `STACK.md` — default stack (Next, Supabase, Tailwind, Lexical), Supabase signup/env var names, security note: never paste `service_role` or DB password in chat; prefer `.env.local`. Linked from `README.md`.  
**Cause:** Lock “speed / low friction” default; answer how to handle API keys with AI assistance safely.  
**Fix / outcome:** Single reference for stack + env hygiene.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — (no commit yet)

**Time:** (local)  
**Commit:** —  
**What:** Added `EDITOR.md` (Lexical as default editor; persistence: recommend remote-first minimal schema vs local JSON trade-offs). Linked from `README.md`; created `workLog.md`.  
**Cause:** Document editor decision and answer how to save user input while staying iterative and multi-machine.  
**Fix / outcome:** Single source doc for editor + data strategy; README index updated.  
**Agent:** Auto (Cursor)
