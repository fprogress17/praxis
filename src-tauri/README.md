# Praxis Tauri Shell

This is the first desktop-shell checkpoint for Praxis.

Current scope:

- development shell only
- opens the split frontend at `http://127.0.0.1:3006`
- relies on the managed backend lifecycle scripts in `scripts/`
- does not package a standalone desktop app yet

Run:

```bash
npm run desktop:dev
```

Current limitations:

- `tauri build` is not the target yet
- the frontend still runs as a local Next dev server
- backend startup is orchestrated by the outer shell script, not bundled as a packaged sidecar

Packaged-runtime contract now exists separately:

```bash
npm run build
npm run desktop:runtime:start
```

That contract starts:

- backend on `127.0.0.1:4001`
- production Next frontend on `127.0.0.1:3007`

The next packaging step can target that managed runtime instead of Next dev mode.
