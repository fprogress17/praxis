# Embedded Browser in Praxis

## Why this is not a full Chrome embed

Praxis runs as a web app, so it cannot mount the real Chrome engine/profile (tabs, extensions, cookies, logged-in state, history database) inside a panel.

What we can ship safely:

- A lightweight in-app browser panel using `iframe`
- URL input + open
- Local history/session persistence inside Praxis (`localStorage`)

What we cannot guarantee:

- Loading every website (many sites block iframes via CSP / `X-Frame-Options`)
- Access to your existing Chrome extensions/sessions
- Full parity with normal Chrome behavior

## Implemented Browser Tab

`RightPanel` now includes a `Browser` tab between `Notes` and `Links`.

Capabilities:

- URL bar (`https://` auto-prefix if missing)
- Embedded page preview via `iframe`
- "Open" button to launch the page in a real browser tab
- Per-scope persistent history (workspace / channel / video context) in localStorage

Notes:

- If embedding is blocked by a target site, use `Open`.
- History is local to this browser profile/device.

## Suggested next upgrades

1. Add bookmarks (star + save label)
2. Add pinned "research sources" per channel/video (DB-backed)
3. Capture selected URL into Notes/Links with one click
4. Add screenshot capture helper (browser API + upload)
5. Add AI summarize-current-page action (server fetch + summarize)

## Chrome extension ideas for Praxis

If you want stronger browsing workflows, a custom Chrome extension can complement Praxis.

### 1) Clip to Praxis

- One-click "Send page to Praxis"
- Capture URL, title, selected text, and quick note
- Choose scope: workspace / channel / video

### 2) YouTube Research Assistant

- On YouTube pages, extract metadata (title, channel, transcript snippets)
- Send to Praxis as draft brief, notes, or source links

### 3) Script-to-TTS Helper

- From any page selection, transform text for narration style
- Push result directly to `TTS Script` field

### 4) Competitive Content Tracker

- Save competitor video URLs to channel link board
- Optional tags: hook style, thumbnail angle, retention pattern

### 5) Fast Capture Hotkey

- Global shortcut to capture current tab into Praxis queue
- Minimal modal for scope + quick tags

## Recommended architecture (extension)

- Extension UI: popup + content scripts
- Backend: Praxis API route with auth token / session check
- Data destination: `workspace_notes`, `notes`, future `links` table
- Security: whitelist destination domains, rate-limit write endpoints

