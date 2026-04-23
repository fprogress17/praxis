# Praxis Tauri Shell

This is the first desktop-shell checkpoint for Praxis.

Current scope:

- development shell against the packaged-style local runtime
- opens the production Next server at `http://127.0.0.1:3007`
- relies on the managed backend/frontend lifecycle scripts in `scripts/`
- does not package a standalone desktop app yet

Run:

```bash
npm run desktop:dev
```

Current limitations:

- `tauri build` is not the target yet
- startup is still orchestrated by outer shell scripts, not bundled as a packaged sidecar
- the split-runtime shell is still separate and available as `npm run desktop:dev:split`

Packaged-runtime contract now exists separately:

```bash
npm run build
npm run desktop:runtime:start
```

That contract starts:

- backend on `127.0.0.1:4001`
- production Next frontend on `127.0.0.1:3007`

The default desktop dev shell now targets that managed runtime instead of Next dev mode.

Native runtime management scaffold:

- `src-tauri/src/runtime.rs` now contains app-side process orchestration for backend/frontend startup and shutdown
- it is gated behind `PRAXIS_DESKTOP_MANAGED_RUNTIME=1`
- this is preparation for packaged startup, not the default dev-shell path yet
