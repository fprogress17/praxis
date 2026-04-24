# Praxis — Next Steps

Current state:
- Local Postgres is the active data store.
- The desktop app is packaged in Tauri and installed as `Praxis.app`.
- Local file storage is active.
- Optional LAN sharing exists through the desktop settings page.
- The frontend/settings/runtime split is working.

## What Still Matters Most

### 1. Add real automated tests

Why:
- The app has gone through a large backend/runtime refactor.
- Desktop packaging and LAN mode now add more startup paths that can regress quietly.

Recommended scope:
- API tests for:
  - `channels`
  - `videos`
  - `notes`
  - `links`
  - `files`
  - `ideas`
  - `settings/desktop`
- One desktop-runtime smoke test that verifies:
  - app starts
  - bootstrap data loads
  - settings route responds
  - file route responds

Priority: highest

### 2. Add basic LAN access protection

Why:
- Right now LAN mode is convenient, but anyone on the same Wi-Fi can reach the app if they know the URL.

Recommended minimum:
- Add an optional shared access token for LAN mode.
- Require that token on API writes first.
- Then expand it to page/bootstrap access if needed.

Nice follow-up:
- Show the token and full iPad URL in the settings page.
- Add a one-tap “copy URL” action.

Priority: high

### 3. Improve desktop settings UX

Why:
- The current settings page works, but it still relies on quit/reopen for network mode changes.

Recommended improvements:
- Add a clear “Restart Praxis to apply” button or desktop command.
- Show the current effective bind mode:
  - `Local only`
  - `Shared on local network`
- Show a warning if no private LAN IP is detected.

Priority: high

### 4. Add data backup/export tools

Why:
- The app is now local-first.
- That makes backup and recovery part of the product, not just deployment.

Recommended scope:
- Export database dump
- Export file storage
- One combined backup folder or zip
- Restore instructions or restore script

Priority: high

### 5. Add file-storage integrity checks

Why:
- Files now live outside the old Supabase path.
- Broken DB/file references will be painful over time without tooling.

Recommended scope:
- verify each file row has a real file on disk
- report orphaned files on disk
- report MIME mismatches

Priority: medium

### 6. Prepare a true browser companion mode

Why:
- The app already supports iPad/browser use over Wi-Fi in principle.
- A more explicit browser-sharing mode would make this easier to trust and operate.

Recommended scope:
- Settings page shows:
  - Mac IP
  - iPad URL
  - LAN mode status
- Add a small connection/help page:
  - “Make sure both devices are on the same Wi-Fi”
  - “If it does not load, check firewall/network permissions”

Priority: medium

### 7. Reduce remaining architectural duplication

Why:
- The app is much cleaner than before, but Next compatibility shims still exist.

Recommended scope:
- Continue shrinking compatibility-only route logic
- Keep the standalone packaged runtime as the real source of truth
- Decide later whether the frontend stays in Next long-term or moves to a thinner frontend stack

Priority: medium

## Recommended Order

1. Automated tests
2. LAN protection
3. Desktop settings restart UX
4. Backup/export
5. File integrity tooling
6. Browser companion polish
7. Further architecture cleanup

## What I Would Do Next

If continuing now, I would pick:

1. Add API and desktop smoke tests
- best risk reduction for the current app

2. Add simple LAN token protection
- best safety improvement for iPad/browser use

3. Add backup/export
- best operational protection for a local-first app

