# Praxis web — work log

Format: **newest at top**. Per `instruction.md`: date, time, commit (if any), brief explanation, cause, fix, agent name.

---

## 2026-04-23 — Fix packaged app data bootstrap to load local Postgres data

**Time:** 13:26 EDT  
**Commit:** `89d3fd1`  
**What:** Fixed the packaged desktop data path so it no longer points at the old split backend. Updated `src-tauri/src/runtime.rs` to blank `NEXT_PUBLIC_API_BASE_URL` and `PRAXIS_API_BASE_URL` in packaged release startup, updated `scripts/install-desktop-app.mjs` to strip those stale env lines from the installed desktop `.env.local`, and changed `package.json` so `npm run desktop:build` clears those API-base vars at build time before producing the standalone bundle. Rebuilt and reinstalled `/Applications/Praxis.app`, then verified `http://127.0.0.1:3007/api/bootstrap` returned the real workspace payload with channels, videos, notes, files, links, and ideas from local Postgres.  
**Cause:** The packaged app UI and API routes were still carrying the old `127.0.0.1:4001` split-backend base URL from the desktop environment and build environment, so the app loaded successfully but fell back to an empty workspace because bootstrap requests were proxying to a backend that no longer exists in packaged mode.  
**Fix / outcome:** The installed Praxis app now uses its own packaged local server and reads data directly from the configured local Postgres database instead of trying to proxy bootstrap through the retired split backend.  
**Agent:** Codex

---

## 2026-04-23 — Fix packaged launcher handoff from splash page to local app URL

**Time:** 13:21 EDT  
**Commit:** `fb7cee1`  
**What:** Replaced the packaged desktop launcher’s `fetch()`-based readiness polling in `desktop-launcher/index.html` with an iframe-based probe that waits for the local app URL to load and then hands off via `window.location.replace()`. Rebuilt and reinstalled `/Applications/Praxis.app`, then relaunched it and confirmed the packaged app again brought up the local server at `http://127.0.0.1:3007/`.  
**Cause:** The packaged splash page was still showing “could not reach the local frontend” even while the bundled local server was healthy, which indicated the handoff probe was failing at the browser-origin/CORS layer rather than the server actually being down.  
**Fix / outcome:** The launcher no longer depends on `fetch()` from the packaged origin to detect readiness, so it can hand off to the healthy local Praxis UI without getting stuck on the splash error page.  
**Agent:** Codex

---

## 2026-04-23 — Fix packaged app launch from Applications by using absolute Node path

**Time:** 13:03 EDT  
**Commit:** `d27002b`  
**What:** Updated the packaged-release runtime in `src-tauri/src/runtime.rs` to use a concrete Node binary path for the bundled standalone server (`/opt/homebrew/bin/node`, `/usr/local/bin/node`, `/usr/bin/node`, or `PRAXIS_DESKTOP_NODE_PATH`) instead of relying on the Finder launch environment to resolve `node` from `PATH`. Rebuilt the desktop bundle, reinstalled `/Applications/Praxis.app`, and verified a clean Applications launch by opening the app and confirming it served `HTTP 200` from `http://127.0.0.1:3007/`.  
**Cause:** The bundled standalone server and support files were present, but opening the app like a normal macOS app failed because the packaged launch environment did not reliably include a shell `PATH` that could find `node`, so the server never started.  
**Fix / outcome:** Praxis now starts its bundled standalone server from `/Applications` using an absolute Node binary path on this machine, so the installed app launches successfully through the normal macOS app path instead of only when run from a terminal session.  
**Agent:** Codex

---

## 2026-04-23 — Make installed Praxis.app launch without the repo checkout

**Time:** 12:58 EDT  
**Commit:** `0636308`  
**What:** Switched Next to `output: "standalone"` in `next.config.ts`, added `scripts/prepare-desktop-bundle.mjs` to stage the standalone server into `src-tauri/bundled/`, updated `src-tauri/tauri.conf.json` to bundle those resources, changed `src-tauri/src/runtime.rs` so packaged release builds start the bundled standalone Next server from inside the app instead of the repo backend/frontend scripts, added `scripts/install-desktop-app.mjs` plus `npm run desktop:install`, and excluded the generated bundled server output from ESLint. Rebuilt the app, installed `/Applications/Praxis.app`, synced `.env.local` and file storage into `~/Library/Application Support/com.praxis.desktop/`, launched the installed app, and verified it served `HTTP 200` from `http://127.0.0.1:3007/`.  
**Cause:** The first packaged app in `/Applications` still depended on the repo checkout because it launched the workspace runtime directly, so it was visible as an app but not actually self-sufficient on this machine.  
**Fix / outcome:** The installed macOS app now carries its own standalone Next server inside the bundle and uses Application Support for env, file storage, and window state. On this machine it can now launch from `/Applications` without calling back into the repo checkout.  
**Agent:** Codex

---

## 2026-04-23 — Build and install Praxis.app into Applications

**Time:** 12:50 EDT  
**Commit:** `b43bd9c`  
**What:** Added a packaged desktop launcher page in `desktop-launcher/index.html`, switched Tauri production bundling to use that launcher in `src-tauri/tauri.conf.json`, enabled release-build native runtime startup by default in `src-tauri/src/runtime.rs`, added `npm run desktop:build` in `package.json`, updated `src-tauri/README.md`, and built a real macOS bundle at `src-tauri/target/release/bundle/macos/Praxis.app`. Then copied that bundle into `/Applications/Praxis.app` and verified the installed app binary exists at `/Applications/Praxis.app/Contents/MacOS/praxis_shell`.  
**Cause:** The desktop shell could run in development, but there was no packaged app bundle in `/Applications` because Tauri bundling was still inactive and production packaging had no valid bundled frontend asset path.  
**Fix / outcome:** Praxis now has a real installed macOS app bundle in `/Applications`. The packaged app still uses this repo’s local backend/frontend runtime on this machine, but it is now visible and launchable as a normal `.app`.  
**Agent:** Codex

---

## 2026-04-23 — Add desktop window-state persistence and Tauri icon set

**Time:** 12:10 EDT  
**Commit:** `4e959db`  
**What:** Added native Tauri window-state persistence in `src-tauri/src/window_state.rs` and wired it into `src-tauri/src/lib.rs` so the desktop shell restores the last main-window size/position on relaunch while preserving maximized state from the last normal bounds. Replaced the placeholder 1x1 desktop icon with a Japanese-inspired ink-circle plus seal design via `src-tauri/icons/icon.svg`, generated the real bundle icon assets (`icon.png`, `icon.icns`, `icon.ico`, platform PNGs), updated `src-tauri/tauri.conf.json` to use them, documented the shell behavior in `src-tauri/README.md`, and re-ran `cargo check`, `cargo test`, `npm run typecheck`, `npm run lint`, `npm run build`, plus a live `npm run desktop:dev` launch.  
**Cause:** The desktop shell had no persisted window geometry, so every relaunch reset to defaults, and the app icon was still a placeholder single-pixel asset that was not suitable for an actual Mac shell. The first live window-state pass also exposed bogus saved bounds from raw runtime values, which would have made restore behavior unsafe.  
**Fix / outcome:** Praxis desktop now has a real icon set and a native window-state path with sanity filtering so obviously invalid bounds are ignored instead of restored. The Rust-side state logic is covered by unit tests, and the desktop shell continues to launch cleanly on the native-managed path.  
**Agent:** Codex

---

## 2026-04-23 — Add mobile drag-and-drop channel reordering

**Time:** 08:05 EDT  
**Commit:** `33f39ed`  
**What:** Added `@dnd-kit`-based drag-and-drop reordering to the mobile channel list in `components/layout/mobile-nav.tsx`, with a mobile drag handle and the same `/api/channels/order` persistence path already used by the desktop sidebar. Wired `MobileNav` into the existing `handleReorderChannels` flow from `components/praxis-shell.tsx`, then re-ran `npm run typecheck`, `npm run lint`, and `npm run build`.  
**Cause:** Desktop already supported drag-and-drop channel reordering, but the narrow/mobile channel list from the top nav still rendered as a static stack of cards with no reorder affordance.  
**Fix / outcome:** Channel ordering behavior is now consistent across desktop and mobile views while reusing the existing reorder API and state path instead of introducing a separate implementation.  
**Agent:** Codex

---

## 2026-04-23 — Promote native-managed shell to default desktop path

**Time:** 07:48 EDT  
**Commit:** `31860f5`  
**What:** Switched `npm run desktop:dev` to the native-managed Tauri path, kept the old packaged-runtime shell as `desktop:dev:scripted`, and updated the root/Tauri docs plus stack notes to reflect the new default. Re-ran `npm run typecheck`, `npm run lint`, `cargo test`, and the real `npm run desktop:dev` launch/shutdown path, then confirmed backend `4001` and frontend `3007` came up and were gone again after exit.  
**Cause:** The native-managed shell path was already verified end to end, so keeping it as a sidecar command no longer matched the packaging direction of the repo.  
**Fix / outcome:** The default desktop dev command now exercises the Rust-managed runtime path, while the script-managed packaged-runtime shell remains available as an explicit rollback path.  
**Agent:** Codex

---

## 2026-04-23 — Verify native-managed desktop shell path

**Time:** 07:45 EDT  
**Commit:** `581f8b5`  
**What:** Added `npm run desktop:dev:native` via `scripts/dev-tauri-native-managed.sh`, which builds the app, opts into `PRAXIS_DESKTOP_MANAGED_RUNTIME=1`, disables Tauri’s dev-server wait deadlock, and launches the shell against `src-tauri/tauri.runtime-dev.conf.json`. Re-ran `npm run typecheck`, `npm run lint`, `cargo test`, and the real native-managed shell path, then confirmed the Rust app itself started backend `4001` and frontend `3007` and that both were gone after exit.  
**Cause:** The Rust-side runtime manager existed, but it had not yet been exercised end-to-end as the actual owner of local runtime startup.  
**Fix / outcome:** Praxis now has a verified native-managed desktop shell path that proves the Tauri app can start and stop the local backend/frontend itself, which is the key packaging transition away from shell-script-only orchestration.  
**Agent:** Codex

---

## 2026-04-23 — Add native Tauri runtime-manager scaffold

**Time:** 07:41 EDT  
**Commit:** `5cce53b`  
**What:** Added `src-tauri/src/runtime.rs` with a native-managed runtime scaffold for backend/frontend process startup, health checks, `.env.local` loading, and shutdown; wired it into `src-tauri/src/lib.rs`; added unit tests for the runtime helpers; and documented the new packaging-oriented env contract in the root README, stack doc, `.env.example`, and `src-tauri/README.md`. Re-ran `cargo check`, `cargo test`, and `npm run smoke:desktop-runtime`.  
**Cause:** The desktop runtime and shell were already working through shell scripts, but the next packaging step needed runtime knowledge to start moving into the Tauri app itself instead of staying entirely in bash.  
**Fix / outcome:** Praxis now has a clean Rust-side runtime manager scaffold behind `PRAXIS_DESKTOP_MANAGED_RUNTIME=1`, which is the first native packaging building block for eventually starting the local runtime from inside the desktop shell.  
**Agent:** Codex

---

## 2026-04-23 — Switch default desktop shell to packaged-style runtime

**Time:** 07:35 EDT  
**Commit:** `a2a1b32`  
**What:** Switched `npm run desktop:dev` to a new `scripts/dev-tauri-runtime.sh` path that builds the app, starts the managed desktop runtime (`backend` on `4001`, production Next frontend on `3007`), and then launches Tauri against `src-tauri/tauri.runtime-dev.conf.json`. Kept the old split-runtime shell available as `npm run desktop:dev:split`, and updated the root/Tauri docs plus stack notes to reflect the new default. Re-ran `npm run typecheck`, `npm run lint`, `npm run smoke:desktop-runtime`, and the real `npm run desktop:dev` shell launch/shutdown path.  
**Cause:** The repo already had a verified packaged-style local runtime contract, so keeping the default desktop shell on top of Next dev mode no longer matched the direction of travel toward packaging.  
**Fix / outcome:** The default Tauri shell path now exercises the same production-style local runtime that future packaging will rely on, while the older split-runtime shell remains available for debugging.  
**Agent:** Codex

---

## 2026-04-23 — Add packaged-style desktop runtime contract

**Time:** 07:31 EDT  
**Commit:** `783e505`  
**What:** Added managed production-style frontend lifecycle scripts (`frontend:start|stop|status|restart`), combined desktop-runtime lifecycle scripts (`desktop:runtime:start|stop|status`), and a real `smoke:desktop-runtime` check that builds the app, starts backend plus Next production server, verifies both local endpoints, and shuts everything down cleanly. Also documented the new runtime contract in the root README, stack doc, `.env.example`, and `src-tauri/README.md`, and excluded `src-tauri/target` from ESLint noise.  
**Cause:** The Tauri dev shell was working, but packaging-oriented work still lacked a concrete local runtime contract for “backend + production frontend” outside Next dev mode.  
**Fix / outcome:** Praxis now has a verified packaged-style local runtime path that a future desktop shell can target directly, which reduces the next packaging step to shell integration instead of process design.  
**Agent:** Codex

---

## 2026-04-23 — Verify desktop shell launch and fix dev integration issues

**Time:** 07:27 EDT  
**Commit:** `19e209b`  
**What:** Ran the real `npm run desktop:dev` Tauri path, confirmed the managed backend on `127.0.0.1:4001`, the split frontend on `127.0.0.1:3006`, and the native shell binary all launched together, then fixed two integration issues: Next dev-origin blocking for the Tauri webview and stale backend PID cleanup on shell exit. Re-ran `npm run typecheck`, `npm run build`, and repeated the real desktop dev launch until exit left `backend:status` clean.  
**Cause:** The first Tauri scaffold compiled, but only a real shell launch could expose webview/dev-server integration issues and process-lifecycle edge cases.  
**Fix / outcome:** The desktop dev shell now launches cleanly against the managed backend and shuts down without leaving stale backend state behind, which makes the shell path reliable enough for the next packaging step.  
**Agent:** Codex

---

## 2026-04-23 — Add first Tauri desktop-shell scaffold

**Time:** 07:20 EDT  
**Commit:** `5b21d03`  
**What:** Added a first `src-tauri/` scaffold, a `desktop:dev` runner, and a minimal Tauri config that targets the split frontend on `127.0.0.1:3006` while relying on the managed backend lifecycle scripts. Also added the required Tauri CLI dependency, placeholder icon asset, and shell-specific docs in the root README, stack doc, and `src-tauri/README.md`. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke:local`, `npm run smoke:backend`, and `cargo check` in `src-tauri/`.  
**Cause:** The standalone backend and lifecycle orchestration were in place, so the next safe step was to prove Praxis could be wrapped in a native shell without changing the existing browser-first runtime.  
**Fix / outcome:** Praxis now has an early Tauri development shell checkpoint that compiles locally and is structurally ready for the next phase: real shell launch verification and sidecar-aware desktop packaging.  
**Agent:** Codex

---

## 2026-04-23 — Add standalone-backend lifecycle orchestration

**Time:** 07:13 EDT  
**Commit:** `3a6451d`  
**What:** Added shared backend env/runtime defaults plus managed `backend:start`, `backend:status`, `backend:stop`, `backend:restart`, and `smoke:backend` scripts; updated split-frontend startup to reuse the same backend URL contract; and documented the new orchestration flow in the root/backend READMEs and `.env.example`. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke:local`, and a real `npm run smoke:backend` lifecycle check.  
**Cause:** The standalone backend existed, but desktop-oriented startup was still just “run the server manually,” which left no deterministic contract for launch, health checking, PID/log handling, or clean shutdown.  
**Fix / outcome:** Praxis now has an explicit backend process orchestration layer that a future Tauri shell can call directly, with consistent host/port/runtime state and a verified managed lifecycle.  
**Agent:** Codex

---

## 2026-04-23 — Archive legacy Next server-action wrappers

**Time:** 06:58 EDT  
**Commit:** `22c33a8`  
**What:** Moved the unused `app/actions/*` server-action wrappers into `archive/next-server-actions/`, added an archive README explaining their status, and verified there are no remaining live imports of `app/actions/*`. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`.  
**Cause:** After the API and standalone-backend cutover, the old server-action layer was no longer part of the runtime but still sat in the active app tree, which made the architecture look more coupled than it actually is.  
**Fix / outcome:** The active runtime tree now reflects the real architecture more clearly, while the old wrappers remain preserved as reference material under `archive/`.  
**Agent:** Codex

---

## 2026-04-22 — Consolidate API logic into shared backend dispatcher

**Time:** 21:57 EDT  
**Commit:** `e3ca649`  
**What:** Moved the actual HTTP API behavior into shared server modules by adding `lib/server/http-api.ts` plus `lib/server/next-api.ts`, shrinking the Next `app/api/*` files into thin compatibility wrappers and switching the standalone backend to use the same dispatcher. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`, then live-verified the split runtime with the backend on `127.0.0.1:4001`, the frontend on `127.0.0.1:3005`, `GET /health`, and `GET /api/bootstrap`.  
**Cause:** Next route handlers and `backend/server.ts` were still carrying duplicated backend behavior, which meant the split architecture could drift even though the frontend already had a standalone-backend path.  
**Fix / outcome:** The standalone backend is now the single place where request behavior is defined, while Next keeps only proxy-or-dispatch compatibility shims plus revalidation. That removes the largest remaining backend duplication without breaking rollback.  
**Agent:** Codex

---

## 2026-04-22 — Proxy Next API routes to standalone backend in split mode

**Time:** 21:43 EDT  
**Commit:** `c81d0c4`  
**What:** Added a shared server-side API proxy helper, updated the Next `app/api/*` route handlers to forward to `PRAXIS_API_BASE_URL` when configured, and broadened default standalone-backend CORS handling to allow localhost/127.0.0.1 dev origins on arbitrary ports. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`, then live-verified a split frontend on `3004` where `http://127.0.0.1:3004/api/bootstrap` returned real data through the standalone backend and the backend emitted the expected CORS headers for `http://localhost:3004`.  
**Cause:** The frontend could already target the standalone backend directly, but the Next route handlers still owned backend logic locally, which kept the split runtime from shrinking toward a true frontend-only Next app.  
**Fix / outcome:** In split mode, Next route handlers now delegate to the standalone backend instead of touching local DB/storage logic first, while fallback behavior remains available when no backend base URL is set.  
**Agent:** Codex

---

## 2026-04-22 — Verify split runtime with standalone backend and frontend

**Time:** 21:31 EDT  
**Commit:** `899572b`  
**What:** Added `npm run dev:split` via `scripts/dev-split-frontend.sh`, documented the split-runtime flow in the root and backend READMEs, updated local `.env.local` on this machine to target `http://127.0.0.1:4001`, and live-verified the separated runtime with backend on `4001` plus frontend on `3003`. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`, then confirmed `HTTP 200` from `http://127.0.0.1:3003/` and rendered app data under the split setup.  
**Cause:** The optional backend-target support existed, but local development still needed a repeatable way to launch the frontend against the standalone backend and prove the split runtime actually worked end to end.  
**Fix / outcome:** Praxis now has a reproducible split-dev path, and the frontend has been verified against the standalone backend without disturbing the rollback path.  
**Agent:** Codex

---

## 2026-04-22 — Add optional frontend target for standalone backend

**Time:** 21:31 EDT  
**Commit:** `ed1ef9f`  
**What:** Added shared API URL helpers so the frontend can optionally target a standalone backend via `NEXT_PUBLIC_API_BASE_URL` / `PRAXIS_API_BASE_URL`, switched client fetch callsites and homepage bootstrap loading to use that base, and added local-dev CORS handling to the standalone backend. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`, then live-verified `http://127.0.0.1:4001/api/bootstrap` plus CORS/preflight headers for origin `http://localhost:3000`.  
**Cause:** The standalone backend existed, but the frontend still hardcoded same-origin `/api/*` requests, which meant there was no safe way to point the UI at the separate process while preserving rollback.  
**Fix / outcome:** Praxis can now be configured to use the standalone backend process as its API target without removing the current in-process Next route path.  
**Agent:** Codex

---

## 2026-04-22 — Add first standalone backend process

**Time:** 21:25 EDT  
**Commit:** `3474249`  
**What:** Added a local-only standalone backend under `backend/` with a small alias loader, wired `npm run backend:dev`, loaded `.env.local` automatically, and served the same API surface as the current Next route handlers against the existing Postgres/file-storage helpers. Verified with `npm run typecheck`, `npm run lint`, `npm run build`, `npm run smoke:local`, plus live `curl` checks to `http://127.0.0.1:4001/health` and `http://127.0.0.1:4001/api/bootstrap`.  
**Cause:** The frontend had already been cut over to explicit API calls, so the next safe step toward a MediaLedger-style architecture was introducing a separate backend process without changing the working app runtime yet.  
**Fix / outcome:** Praxis now has a standalone backend checkpoint that runs locally on `127.0.0.1:4001` by default and can serve the existing API surface independently of Next.  
**Agent:** Codex

---

## 2026-04-22 — Remove remaining client-side Next server-action imports

**Time:** 21:17 EDT  
**Commit:** `0951a5a`  
**What:** Added shared idea/workspace-idea helpers plus API routes, switched the idea UI flows to HTTP calls, and verified there are no remaining `@/app/actions/*` imports in `components`, `app`, or `lib`. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`.  
**Cause:** The app had already been mostly converted to explicit route handlers, but idea creation/edit/delete still depended on client-side imports of Next server actions.  
**Fix / outcome:** The live UI now talks only to API routes, which completes the client-side runtime cutover and leaves `app/actions` as compatibility wrappers rather than active frontend dependencies.  
**Agent:** Codex

---

## 2026-04-22 — Add explicit HTTP API slice for notes, links, and files

**Time:** 21:14 EDT  
**Commit:** `2f37fea`  
**What:** Extracted note, workspace-note, link, and file persistence into shared server helpers; added API routes for `notes`, `workspace-notes`, `links`, and `files`; extended `/api/files/[id]` to handle file update/delete alongside file reads; and switched the right-panel notes, links, file upload/delete, and markdown save flows from server actions to HTTP calls. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`.  
**Cause:** After channels and videos were API-backed, the right panel was the largest remaining runtime surface still coupled directly to Next server actions, which would block a clean frontend/backend split.  
**Fix / outcome:** The full right-panel CRUD path now goes through explicit API routes while preserving the current local-Postgres and local-file-storage behavior.  
**Agent:** Codex

---

## 2026-04-22 — Add explicit HTTP API slice for videos and script versions

**Time:** 21:07 EDT  
**Commit:** `8139aca`  
**What:** Extracted video mutations and script-version persistence into shared server helpers, added `POST /api/videos`, `PATCH/DELETE /api/videos/[id]`, and `GET/POST /api/videos/[id]/script-versions`, and switched the new-video, edit-video, delete-video, and script-version UI flows from server actions to HTTP calls. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`.  
**Cause:** The channel slice established the first backend seam, but the video editor still depended on direct Next server-action calls, which would block a clean standalone backend split.  
**Fix / outcome:** The full video workflow now speaks explicit API routes while the current local-Postgres runtime and rollback path remain intact.  
**Agent:** Codex

---

## 2026-04-22 — Add first explicit HTTP API slice for channels and homepage snapshot

**Time:** 21:00 EDT  
**Commit:** `81f6192`  
**What:** Extracted the homepage data load into a shared workspace snapshot service, added `GET /api/bootstrap`, `GET/POST /api/channels`, and `PATCH /api/channels/order`, and switched the client-side channel create/reorder path from server actions to explicit HTTP calls. Re-ran `npm run typecheck`, `npm run lint`, `npm run build`, and `npm run smoke:local`.  
**Cause:** The next safe step toward a MediaLedger-style shared backend is to make the app speak API-shaped boundaries one slice at a time instead of keeping UI mutations coupled directly to Next server actions and inline page SQL.  
**Fix / outcome:** Channels and initial workspace loading now have reusable service code plus HTTP entry points, giving the repo a concrete backend seam without disturbing the rest of the local-Postgres runtime.  
**Agent:** Codex

---

## 2026-04-22 — Commit archival source docs, extension scaffold, and legacy migrations

**Time:** 16:36 EDT  
**Commit:** `f237c98`  
**What:** Added the embedded-browser design note, Chrome extension scaffold, and legacy Supabase migration files to git as archival/reference material. Also committed the ESLint config ignore update that keeps generated files out of lint. Re-ran `npm run typecheck`, `npm run lint`, and `npm run smoke:local`.  
**Cause:** These files were still only present in the local working tree even though they document or preserve historical product/runtime paths that are useful for migration and future feature work.  
**Fix / outcome:** The repo now preserves the relevant historical source material and lint behavior, while user-side scratch files remain untouched.  
**Agent:** Codex

---

## 2026-04-22 — Commit active browser, ideas, and type files

**Time:** 16:35 EDT  
**Commit:** `9622b7c`  
**What:** Added the currently used browser-panel component, idea components, and supporting row/type files to source control, together with the tracked channel/video/type updates they depend on. Re-ran `npm run typecheck`, `npm run lint`, and `npm run smoke:local`.  
**Cause:** The runtime was already importing these files from the working tree, but they were still outside committed history, which meant the checked-in repo did not fully match the app actually being run.  
**Fix / outcome:** The active app surface is now being brought into git as a coherent checkpoint instead of relying on local-only files.  
**Agent:** Codex

---

## 2026-04-22 — Rename runtime config flag away from Supabase wording

**Time:** 16:33 EDT  
**Commit:** `8ebf181`  
**What:** Renamed the active app-path prop and gating semantics from `supabaseConfigured` to `dataConfigured` across page load, shell layout, right panel, notes, links, files, and navigation/sidebar components. Re-ran `npm run typecheck`, `npm run lint`, and `npm run smoke:local`.  
**Cause:** The runtime had already been cut over to local Postgres, but the live component API still carried stale Supabase naming, which made the architecture harder to reason about.  
**Fix / outcome:** The active code path now reflects the current backend model more accurately without changing behavior.  
**Agent:** Codex

---

## 2026-04-22 — Add standalone local runtime smoke check

**Time:** 16:26 EDT  
**Commit:** `1e8a102`  
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
