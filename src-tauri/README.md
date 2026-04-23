# Praxis Tauri Shell

This is the first desktop-shell checkpoint for Praxis.

Current scope:

- development shell against the packaged-style local runtime
- opens the production Next server at `http://127.0.0.1:3007`
- relies on the managed backend/frontend lifecycle scripts in `scripts/`
- can now build a real macOS `.app` bundle that launches the local runtime from this repo on this machine

Run:

```bash
npm run desktop:dev
```

Build a macOS app bundle:

```bash
npm run desktop:build
```

Install the built app plus local desktop support files:

```bash
npm run desktop:install
```

Current limitations:

- the packaged `.app` still depends on this repo’s local backend/frontend files and `node_modules`
- startup is still a local-runtime handoff, but release builds now bundle a standalone Next server instead of calling back into the repo checkout
- the split-runtime shell is still separate and available as `npm run desktop:dev:split`

Packaged-runtime contract now exists separately:

```bash
npm run build
npm run desktop:runtime:start
```

That contract starts:

- backend on `127.0.0.1:4001`
- production Next frontend on `127.0.0.1:3007`

The default desktop dev shell now targets that managed runtime through the Rust app itself instead of shell-side startup.

Native runtime management scaffold:

- `src-tauri/src/runtime.rs` now contains app-side process orchestration for backend/frontend startup and shutdown
- `src-tauri/src/window_state.rs` now persists the last main-window size/position and restores it on relaunch
- desktop icon assets now come from `src-tauri/icons/icon.svg` plus generated bundle icons
- it is enabled by `PRAXIS_DESKTOP_MANAGED_RUNTIME=1` in dev and by default in packaged release builds
- the packaged app uses a tiny bundled launcher page that hands off to the local frontend on `127.0.0.1:3007`
- `npm run desktop:install` syncs the current `.env.local` and `local-storage/praxis-files` into `~/Library/Application Support/com.praxis.desktop/`

Try the native-managed path directly:

```bash
npm run desktop:dev:native
```

That path is now the same architecture as the default `npm run desktop:dev`.

Shell-managed rollback path:

```bash
npm run desktop:dev:scripted
```
