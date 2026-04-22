# Praxis Clipper (Chrome Extension)

Minimal MV3 extension to capture current tab context for Praxis workflows.

## Features (v0)

- Reads active tab URL/title
- Scope selector: workspace / channel / video
- Quick note field
- `Copy JSON` for manual paste into Praxis
- `Open Praxis` shortcut
- Local clip history (stored in `chrome.storage.local`)

## Install (unpacked)

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select this folder: `praxis-web/chrome-extension/praxis-clipper`

## Notes

- This version does **not** send data directly to Praxis DB yet.
- Next step can add an authenticated API call to store clips as:
  - workspace notes
  - channel notes
  - video notes
  - links table (future)
