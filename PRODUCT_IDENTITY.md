# Praxis — product identity (living)

*Last updated: 2026-04-12*

This document is the **source of truth** for what **Praxis** means in the **`praxis-web`** codebase *right now*, how that differs from earlier intent, and what comes later. Other docs (e.g. [REQUIREMENTS_AND_DECISIONS.md](./REQUIREMENTS_AND_DECISIONS.md)) should stay aligned with it.

---

## 1. What Praxis is **now** (active focus)

**Praxis is a YouTube channel creation workspace** — a desktop-first web app for organizing work **by channel**, drafting **videos** (title, brief, script), capturing **notes** beside the workflow, and (soon) using an **AI** tab for creator-focused help — currently backed by **local Postgres** and local file storage for safety-first local development.

- **Channels** = YouTube-style workspaces (your show, series, or brand — each with its own videos and notes).
- **Videos** = planned or in-progress pieces (metadata + script area), not “memory entries” in the abstract.
- **Right panel** = context for the *selected* channel (notes, future links, future AI chat scoped to that channel).

The UI tagline in the app reflects this: **personal YouTube creation workspace** (or equivalent short line — see shell copy).

---

## 2. What Praxis was **before** (historical, not the main story in UI)

Early exploration (including **`../Praxis_Swift/`**) framed Praxis as **“Personal project memory”**: a broader system for projects, progress, lessons, and timeline-style recall **over time** — richer than a todo list, not tied to YouTube.

That vision is **not discarded**; it is **deferred and renamed** as a **later phase** (see §4). The **web app** deliberately pivoted to a **narrow, shippable** identity (YouTube creation) so features and copy stay coherent while the product matures.

---

## 3. Why the identity shifted

| Factor | Notes |
|--------|--------|
| **Move from Swift to web** | Faster iteration, shared backend, one URL for laptop + desktop. |
| **Clarity** | “Project memory” is broad; **YouTube creation** explains channels, videos, and scripts immediately. |
| **Shipping** | A scoped tool can reach “useful daily” sooner; generic memory systems sprawl without strong defaults. |

---

## 4. Roadmap: mature **YouTube Praxis** first, then **Personal project memory**

| Phase | Focus | Relationship |
|--------|--------|--------------|
| **A — Now** | **YouTube channel creation tool** (this repo): channels, videos, notes, layout, optional AI for titles/scripts/hooks. | Current **Praxis** identity. |
| **B — Later** | **Personal project memory** as a **separate surface or product line** — broader projects, history, lessons, timelines — possibly reusing tech and patterns from Praxis once the stack is stable. | **Not** the default story in the app until you intentionally build it. |

Until Phase B exists, avoid promising “memory OS” in user-facing copy; keep marketing and UI aligned with **creator workflow**.

---

## 5. Terminology (quick reference)

| Term | Meaning in Praxis today |
|------|-------------------------|
| **Channel** | A top-level bucket for one YouTube “lane” (show, topic, or brand). |
| **Video** | A draft or planned video row (title, brief, script). |
| **Notes** | Per-channel scratchpad in the right panel (not global “life OS” yet). |
| **Workspace / Home** | App shell; **Home** with no channel selected = neutral dashboard. |

---

## 6. AI tab — suggestions **updated for YouTube creation**

These replace earlier generic “project memory” examples. Implementation is still **your** UI + **APIs** (server-side keys); no embedding ChatGPT.com / Claude web in an iframe.

**Useful directions for the AI tab:**

- **Titles & packaging** — variants, A/B angles, curiosity gaps (from brief + niche).
- **Hooks & cold opens** — first 30s lines from brief/script.
- **Outline → script** — beat sheet, talking points, B-roll ideas.
- **Description & chapters** — YouTube description draft, chapter timestamps from outline.
- **SEO / keywords** — tags and search phrases (you verify accuracy).
- **Repurpose** — short hooks for Community / Shorts from a long script (manual paste).

**Context to pass into prompts (when you build the feature):** active channel name, category, channel brief, selected video fields, optional note excerpts — so answers stay scoped like a **room assistant**, not a generic chatbot.

**History:** Same as before technically — you store turns (state, `localStorage`, or another persistence layer) and send recent messages with each request; **“new chat”** clears your stored thread.

---

## 7. Chat vs browser ChatGPT (unchanged technically, reframed)

- **Not** the same product as the ChatGPT website — same *kind* of models via **API**, **your** UI and rules.
- **History & context** — yes, if **you** persist messages and resend them (or use provider thread APIs); **new chat** = you reset storage.
- **YouTube angle** — system prompts and presets should assume **creator workflow** (above), not generic journaling.

---

## 8. Related docs

| File | Role |
|------|------|
| [REQUIREMENTS_AND_DECISIONS.md](./REQUIREMENTS_AND_DECISIONS.md) | Priorities, constraints, delivery strategy. |
| [STACK.md](./STACK.md) | Next.js, local Postgres, env safety. |
| [SETUP-SUPABASE.md](./SETUP-SUPABASE.md) | DB setup. |
| [workLog.md](./workLog.md) | Dated changes. |

---

## 9. Changelog (identity)

| Date | Change |
|------|--------|
| 2026-04-12 | Document created: active identity = **YouTube channel creation**; **Personal project memory** deferred to a later phase; AI suggestions and chat notes reframed for creators. |
