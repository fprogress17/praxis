# Praxis web — work log

Format: **newest at top**. Per `instruction.md`: date, time, commit (if any), brief explanation, cause, fix, agent name.

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
