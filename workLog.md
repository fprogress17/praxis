# Praxis web — work log

Format: **newest at top**. Per `instruction.md`: date, time, commit (if any), brief explanation, cause, fix, agent name.

---

## 2026-04-22 — Add standalone local runtime smoke check

**Time:** 16:26 EDT  
**Commit:** (pending)  
**What:** Added `scripts/smoke-local-runtime.mjs` and `npm run smoke:local` to validate `DATABASE_URL`, required public tables, row counts, and local file storage root outside the Next.js runtime. Also moved tooling-only `@supabase/supabase-js` and `@types/pg` intent into non-runtime usage and refreshed the lockfile.  
**Cause:** After the cutover and doc cleanup, there was still no one-command verification for the local runtime itself, and the first smoke pass failed because `.env.local` was not being loaded in the standalone script.  
**Fix / outcome:** `npm run smoke:local` now passes against the local `praxis` database and gives a quick health check for the migrated runtime.  
**Agent:** Codex

---

## 2026-04-22 — Update docs for local runtime and verify dev boot

**Time:** 16:22 EDT  
**Commit:** `4cbbc83`  
**What:** Updated README, STACK, PRODUCT_IDENTITY, and SETUP-SUPABASE so they reflect the new local-Postgres/local-file-storage runtime while preserving Supabase docs as migration-source references. Started `npm run dev` and confirmed the app responded `HTTP/1.1 200 OK` on `http://localhost:3000`.  
**Cause:** After the runtime cutover, the main remaining mismatch was documentation still describing Supabase as the active backend.  
**Fix / outcome:** Repo guidance now matches the current architecture and the live local runtime was verified end-to-end.  
**Agent:** Codex

---

## 2026-04-22 — Cut runtime over to local Postgres and local file storage

**Time:** 16:19 EDT  
**Commit:** `f1e4e63`  
**What:** Replaced the app runtime’s Supabase table access with a shared Postgres layer, added a local file storage layer plus `/api/files/[id]` serving, moved file upload/delete/edit flows to server actions backed by local disk, added plain-Postgres schema/apply/export helpers, and verified `npm run typecheck`, `npm run lint`, and `npm run build`.  
**Cause:** User requested a safety-first full migration from Supabase to local Postgres using the provided local database URL.  
**Fix / outcome:** Praxis now runs against local Postgres via `DATABASE_URL` and serves file content from local storage instead of Supabase Storage, with the migrated data already loaded into the local `praxis` database.  
**Agent:** Codex

---

## 2026-04-15 — Verify video delete by re-reading row

**Time:** 13:33 EDT  
**Commit:** (pending)  
**What:** Changed episode-row delete verification so it no longer depends on `DELETE ... RETURNING` returning a row. The UI now deletes first, then re-queries the target video id; it only reports failure if the row still exists after delete.  
**Cause:** User still saw the no-row delete error after applying the previous delete verification path.  
**Fix / outcome:** Delete success is now based on whether the video row remains in Supabase, which avoids false failures from empty delete-return payloads.  
**Agent:** Codex

---

## 2026-04-15 — Verify video delete actually removes row

**Time:** 13:28 EDT  
**Commit:** (pending)  
**What:** Changed episode-row video delete to use the browser Supabase client directly with `.delete().eq("id", video.id).select("id")`, then checks the returned deleted rows before closing the popup. Added clearer RLS/migration error copy for missing `018_videos_delete_policy.sql`.  
**Cause:** User confirmed the delete popup appeared but the video was not deleted.  
**Fix / outcome:** Delete now verifies Supabase actually removed a row and reports a concrete error if no row was deleted or delete permission is missing.  
**Agent:** Codex

---

## 2026-04-15 — Custom video delete confirmation popup

**Time:** 13:26 EDT  
**Commit:** (pending)  
**What:** Replaced native `confirm()` for video row deletion with a custom anchored popup opened from the trash icon. Popup shows video label, warning copy, Delete / Cancel buttons, outside-click and Escape dismissal, and loading state while delete runs.  
**Cause:** User reported no popup from the episode video delete icon.  
**Fix / outcome:** Delete confirmation is now an in-app popup instead of a browser dialog.  
**Agent:** Codex

---

## 2026-04-15 — Delete videos from episode list

**Time:** 13:24 EDT  
**Commit:** (pending)  
**What:** Added video delete server action, trash icon on each channel video row, confirmation prompt, row-level error display, and `018_videos_delete_policy.sql` for delete RLS/grant. Updated Supabase setup docs.  
**Cause:** User requested a delete icon and confirmation popup in each channel's video episode list.  
**Fix / outcome:** Videos can now be deleted directly from the episode list after confirmation.  
**Agent:** Codex

---

## 2026-04-15 — Harden new-video channel binding

**Time:** 13:19 EDT  
**Commit:** (pending)  
**What:** Keyed `NewVideoForm` by channel id from `PraxisShell` so the composer remounts when opening Add video for a different channel. Added a submit-time guard that rejects saving if the submitted hidden `channel_id` does not match the active composer channel, and surfaced a short channel id beside the displayed channel name.  
**Cause:** User reported adding a video to `あの時こうしていれば 이럴줄 알았으면` but the episode was saved under the `Too Late Note` channel, indicating stale or mismatched channel binding in the new-video form.  
**Fix / outcome:** The new-video form is now explicitly tied to the selected channel and refuses to submit stale channel ids.  
**Agent:** Codex

---

## 2026-04-14 — Image board vertical splitter

**Time:** 15:28 EDT  
**Commit:** (pending)  
**What:** Replaced the Image board's fixed left/right grid split with a draggable vertical divider between the image file list/drop area and the image card board. The divider can collapse either side while leaving the handle available.  
**Cause:** User wanted the vertical bar between image file list and image card list to be draggable.  
**Fix / outcome:** Image board now has independent horizontal resizing for its internal panes, separate from the general file explorer split.  
**Agent:** Codex

---

## 2026-04-14 — Links tab add/edit/delete implementation

**Time:** 14:34 EDT  
**Commit:** (pending)  
**What:** Added `public.links` migration, `LinkRow` type, link server actions, and a scoped `LinksSection` with add button, URL/title/note form, list, open, edit, and delete. Wired workspace/channel/video link filtering through page load, `PraxisShell`, and `RightPanel`. Updated Supabase setup docs with `017_links.sql`.  
**Cause:** User noted the Links tab only had placeholder copy and no add button; docs described future research/source links and link board use cases.  
**Fix / outcome:** Links is now a functional right-panel tab for saved research sources, competitor URLs, references, and episode/channel/workspace links.  
**Agent:** Codex

---

## 2026-04-14 — Files tab vertical section resizing

**Time:** 14:19 EDT  
**Commit:** (pending)  
**What:** Moved the Files context card inside the Files tab and added horizontal drag bars between **Image board**, **File explorer**, and **Context**. Dragging a bar redistributes height between adjacent sections. The standard right-panel Context card remains for non-Files tabs.  
**Cause:** User wanted the three Files sections separated by horizontal lines and resizable by dragging those lines to give any section more room.  
**Fix / outcome:** Files tab now has three vertically resizable sections with visible horizontal resize handles.  
**Agent:** Codex

---

## 2026-04-14 — Files delete avoids server-action POST failure

**Time:** 14:04 EDT  
**Commit:** (pending)  
**What:** Changed Files delete to remove the Supabase Storage object and `public.files` metadata directly from the client Supabase SDK instead of calling a Next server action. Clean-restarted the dev server after removing stale `.next` cache.  
**Cause:** User hit `POST / 500` with `__webpack_modules__[moduleId] is not a function` during delete, alongside webpack cache rename failures in dev.  
**Fix / outcome:** Delete no longer uses the failing server-action POST path; dev server is running from a clean `.next` cache on port 3001.  
**Agent:** Codex

---

## 2026-04-14 — Image-only board above file explorer

**Time:** 13:54 EDT  
**Commit:** (pending)  
**What:** Added an image-only section above the general Files explorer. The left pane has an image drop zone plus image-file list; the right pane shows full image cards in a horizontal ordered board. Image cards can be dragged to rearrange order, persisted per workspace/channel/video scope in localStorage.  
**Cause:** User wanted a dedicated image section where dropped images become visible ordered cards, with the left side serving as image drop/list area.  
**Fix / outcome:** Files tab now separates image ordering from the general file explorer while reusing the same Supabase file upload/storage path.  
**Agent:** Codex

---

## 2026-04-14 — Files panel markdown editor + draggable split

**Time:** 13:43 EDT  
**Commit:** (pending)  
**What:** Added Markdown reader/edit mode controls in the Files preview header; Markdown edit mode uses a full-height textarea editor and saves back to the same Supabase Storage object. Replaced the fixed file-list/preview grid with a draggable vertical splitter that can collapse either pane.  
**Cause:** User wanted `.md` files to support reader vs editor modes and wanted a draggable divider between file explorer and content preview.  
**Fix / outcome:** Files tab now supports editable Markdown previews and adjustable/collapsible two-pane layout.  
**Agent:** Codex

---

## 2026-04-14 — Right panel Files tab with Supabase Storage

**Time:** 13:14 EDT  
**Commit:** (pending)  
**What:** Added **Files** tab beside **Notes / Browser / Links / AI** for workspace, channel, and video scopes; added drag/drop multi-upload, file explorer list, preview pane for text/Markdown, images, PDFs, and download fallback; added `public.files` metadata plus private `praxis-files` Supabase Storage bucket migration. Updated setup/stack docs.  
**Cause:** User wanted files available at both channel and video levels, with a two-panel file explorer and content preview.  
**Fix / outcome:** File bytes are stored in Supabase Storage for now, while `public.files` stores scope metadata so the existing right-panel lens controls which files appear.  
**Agent:** Codex

---

## 2026-04-14 — Code/docs check + lint/typecheck config cleanup

**Time:** 13:00 EDT  
**Commit:** (pending)  
**What:** Reviewed app/docs consistency; fixed lint config so generated Next files (`.next/**`, `next-env.d.ts`) are not linted; changed `npm run typecheck` to `tsc --noEmit --incremental false`; ignored `tsconfig.tsbuildinfo`; updated `STACK.md` first-time Supabase note to point to the ordered migration list. Verified `npm run lint`, `npm run typecheck`, and `npm run build`.  
**Cause:** User asked to check code and docs; project checks initially failed because generated Next/TypeScript artifacts were included in lint/typecheck workflows, and one setup doc still referenced only the initial channels migration.  
**Fix / outcome:** Source checks now pass without linting generated framework files or writing TypeScript cache during explicit typecheck; setup docs now direct readers to the current migration sequence.  
**Agent:** Codex

---

## 2026-04-12 — Browser tab + embedded-browser doc + extension scaffold

**Time:** (local)  
**Commit:** (pending)  
**What:** Right panel adds **Browser** tab (`iframe` preview + URL + per-scope local history); added **`EMBEDDED_BROWSER.md`** (limitations and extension strategy); scaffolded **`chrome-extension/praxis-clipper`** (MV3 popup clipper: copy JSON, open Praxis, local history).  
**Cause:** User requested embedded browsing and practical alternatives, plus extension ideas.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Notes list: trash on right; `013_notes_delete`

**Time:** (local)  
**Commit:** (pending)  
**What:** **`013_notes_delete.sql`**; **`deleteNote`** server action; **`NotesSection`** row = edit (left) + small **`Trash2`** delete (right) with confirm.  
**Cause:** User wanted delete on note cards.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Right panel: channel vs video scope for Notes / Links / AI copy; `012_notes_video_id`

**Time:** (local)  
**Commit:** (pending)  
**What:** **`012_notes_video_id.sql`** (nullable **`video_id`** on **`notes`**); **`rightPanelNotes`** filters **channel-only** vs **this video** when **`edit-video`**; **`NotesSection`** passes **`video_id`** on create; **RightPanel** Links/AI/context text by scope.  
**Cause:** User wanted Praxis panel to follow channel list vs video editor.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Sidebar: New channel + Idea (workspace); `011_workspace_ideas`; dev without Turbopack

**Time:** (local)  
**Commit:** (pending)  
**What:** **`011_workspace_ideas.sql`** (`workspace_ideas` table); **`create/update/deleteWorkspaceIdea`**; **`NewWorkspaceIdeaForm`** + **`WorkspaceIdeaSidebarList`** under the channel list; split header buttons in **Sidebar** / **MobileNav**; **`npm run dev`** uses **webpack** by default (**`npm run dev:turbo`** for Turbopack) to reduce **`.next`** ENOENT manifest errors.  
**Cause:** User wanted pre-channel ideas under the channel list; Turbopack dev was unstable.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Ideas: edit/delete + clean script; `010` migration

**Time:** (local)  
**Commit:** (pending)  
**What:** **`010_ideas_update_delete.sql`** (RLS update/delete + grants); **`updateIdea`** / **`deleteIdea`** server actions; **`ChannelIdeaList`** inline edit + delete with confirm; **`npm run clean`** / **`dev:clean`** to fix stale **`.next`** ENOENT with Turbopack.  
**Cause:** User hit missing **`.next`** manifest errors; requested edit/delete for ideas.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Channel card: Add video + Idea; ideas list + new-idea composer

**Time:** (local)  
**Commit:** (pending)  
**What:** **`009_ideas.sql`** (`ideas` table + RLS); **`createIdea`** action; **`page`** loads **`initialIdeas`**; **`ChannelCard`** two-column footer (**Add video** / **Idea**); **`new-idea`** mode in **`PraxisShell`** (same workspace header as new video) with **`NewIdeaForm`**; **`ChannelIdeaList`** under **`ChannelVideoList`** on home.  
**Cause:** User wanted a lighter capture flow than full video form, with saved ideas visible under the channel’s video list.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — List row: dot + anchored popover for next episode promise

**Time:** (local)  
**Commit:** `692253b`  
**What:** **Channel video** rows split main **button** vs right **promise dot** (only if text); **`createPortal`** popover **`fixed`** with **top/left** at dot; outside click / **Escape** closes.  
**Cause:** User wanted a small control on the card that opens a popup tied to the dot, not full-screen.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Next episode promise field + wider episode select

**Time:** (local)  
**Commit:** `69dddcb`  
**What:** **`008_videos_next_episode_promise.sql`**; **`next_episode_promise`** on **VideoRow** / **page** / **create & update**; textarea **above Save** on new/edit forms; episode select **`w-[7rem]`** so **ep0001** isn’t clipped.  
**Cause:** User asked for “Next episode promise” section above save; horizontal clip on episode dropdown.  
**Fix / outcome:** Stored per video; UI matches Brief/Script styling.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Video status pulldown + compact episode/status row

**Time:** (local)  
**Commit:** `56f9b6f`  
**What:** **`007_videos_status.sql`** (`draft` / `published` / `skip` / `to_be_published`); **`lib/video-status.ts`**; **`VideoEpisodeStatusRow`** (small **`text-label`** selects **`h-7`**, color **dot** next to status); **create/update** + list **dot**; **SETUP** 007.  
**Cause:** User wanted status dropdown with colors and smaller episode/status controls.  
**Fix / outcome:** Native `<option>` can’t show per-option colors; dot reflects current status.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Video episode dropdown (ep0001–ep2000) + DB unique per channel

**Time:** (local)  
**Commit:** `5f1a77e`  
**What:** **`006_videos_episode.sql`** (`episode` text + partial unique index); **`lib/episode.ts`**; **New/Edit video** `<select>` above title; **`createVideo`/`updateVideo`**; list shows episode chip; **SETUP-SUPABASE** line.  
**Cause:** User asked for episode selector like ep0001 on new video form.  
**Fix / outcome:** Defaults to next free code per channel; duplicate episode blocked with clear error.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Product identity: YouTube creation workspace + PRODUCT_IDENTITY.md

**Time:** (local)  
**Commit:** `acf68a5`  
**What:** **`PRODUCT_IDENTITY.md`** — Praxis = **YouTube channel creation** now; **Personal project memory** deferred to a later phase; roadmap, terminology, AI-tab suggestions reframed for creators; **REQUIREMENTS**, **README**, **STACK**, **`layout` metadata**, **sidebar / mobile / home / right panel** copy updated.  
**Cause:** User clarified pivot from Swift-era “personal project memory” to a YouTube-focused tool while keeping the Praxis name.  
**Fix / outcome:** Single source of truth for identity; UI tagline and placeholders match.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Right panel width 0 … full split (center can collapse / fill)

**Time:** (local)  
**Commit:** `d24794f`  
**What:** **`splitRegionRef`** wraps center + handle + right; **`useRightPanelWidth`** clamps to **`[0, splitWidth − 12px]`** (no fixed 220–560); **ResizeObserver** reclamps on resize + localStorage hydrate. **`RightPanel`**: `min-w-0 overflow-hidden`.  
**Cause:** User wanted drag to extremes: center full vs right full beside sidebar.  
**Fix / outcome:** Drag toward sidebar → right grows until center disappears; drag toward main → right shrinks to 0 and center fills.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Resize splitter tracks pointer; Praxis → home

**Time:** (local)  
**Commit:** `b28fcb6`  
**What:** **`useRightPanelWidth`**: width from `row.right − handleLeft − 12px` so drag follows the bar; **`goHome`** + **`onGoHome`** on **Sidebar**, **MobileNav**, **MobileChannelsCollapsedBar** (tap **Praxis** → dashboard).  
**Cause:** User wanted clearer drag-right-widens behavior and root “home” from the Praxis label.  
**Fix / outcome:** Splitter uses flex row + handle refs; branding buttons clear channel selection and exit video flows.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Draggable vertical split (center / right panel, xl+)

**Time:** (local)  
**Commit:** `60c9bc5`  
**What:** **`useRightPanelWidth`** (localStorage `praxis:rightPanelWidthPx`, 220–560px); **`PanelResizeHandle`** between **`CenterPanel`** and **`RightPanel`**; **`RightPanel`** takes **`widthPx`**.  
**Cause:** User asked for a horizontal-drag resize on the bar between center and right columns.  
**Fix / outcome:** Drag the strip at the left edge of the right column (xl+); width persists across reloads.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — Right panel: Notes tab (+ inline editor, list) + `005_notes`

**Time:** (local)  
**Commit:** `1fdc9b8`  
**What:** **`005_notes.sql`** (`public.notes` + RLS); **`app/actions/notes.ts`**; **`NotesSection`** (+ button, title/body/Save inline, list); **`RightPanel`** tab buttons (Notes / Links / AI); **page** loads notes.  
**Cause:** User asked for inline notes in the right column under Notes, Links, AI.  
**Fix / outcome:** Channel-scoped notes; **`npm run db:push -- --yes`** applies **`005_notes.sql`**.  
**Agent:** Auto (Cursor)

---

## 2026-04-12 — One-paste SQL for `videos` + SETUP troubleshooting

**Time:** (local)  
**Commit:** `604bb8d`  
**What:** **`supabase/manual_apply_videos_full.sql`** — single file combining **`002` + `003` + `004`** for Dashboard paste; **SETUP-SUPABASE** fastest-fix + env project match note.  
**Cause:** Handoff: UI still showed missing `videos` table; user needs one clear path without hunting migration files.  
**Fix / outcome:** Paste once after **`001`**; Table Editor should show **`videos`**.  
**Agent:** Auto (Cursor)

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
