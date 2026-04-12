# Praxis — Editor & persistence

*Last updated: 2026-04-12*

## Editor: Lexical (starting point)

### Choice

**Lexical** is the default rich-text engine for this project. Implementation is **incremental**: add plugins, nodes, and toolbar actions **as you need them**, not as a full spec on day one.

### Why Lexical (for you)

| Factor | Notes |
|--------|--------|
| **Control** | You own layout, typography, and behavior via composable nodes and plugins. |
| **Aesthetic** | No fixed “editor skin”; styling follows **Praxis design tokens** (e.g. Inter for UI chrome, serif for longform where desired — aligned with Marginalia-style editorial calm). |
| **Adjacency** | **Marginalia** already uses Lexical (`chapter-lexical-editor`); patterns and lessons can transfer. |
| **Performance / model** | Modern tree model, suitable for growing complexity (custom blocks later, e.g. callouts or structured snippets). |

### What Lexical is not (by itself)

- Not a full **Notion clone** out of the box — block-heavy UX may need **custom nodes** or a different layer later.
- **Collaboration** (live multi-cursor) is a **later** concern; serializing document state to JSON for storage is the near-term focus.

### Direction of travel (as-needed)

Examples of things to add only when the product asks for them:

- Headings, lists, links, quotes (baseline editorial).
- Mentions / internal links to projects.
- Paste cleanup, slash menu, floating toolbar.
- Markdown import/export (optional; not assumed v1).

Document concrete milestones in **`workLog.md`** when editor behavior changes.

---

## Persistence: remote first vs local JSON first

You want **what you type to be saved**, with an **iterative** process and **two machines** (desktop + laptop) sharing data, **mostly online**.

### Recommendation: **remote / hosted persistence from the start** (minimal schema)

Use a **small hosted backend** (e.g. Supabase, Neon + thin API, or similar) with a **minimal first table** — even a single row type like `documents` or `entries` with `id`, `updated_at`, and **`content_json`** (Lexical serialized state) or `body` text. Expand schema **when you need** (projects, tags, RLS, etc.).

**Why this fits your stated constraints better than “local JSON only”:**

| Your goal | Local JSON / file only | Remote from day one |
|-----------|-------------------------|---------------------|
| **Laptop + desktop** | No automatic shared truth (unless fragile file sync). | Same DB → same data on both machines. |
| **Mostly online** | You’re already assuming connectivity. | Natural fit. |
| **Grow schema as you go** | You still “migrate” when you introduce a real DB later — **data shape + import path** become a dedicated project. | Migrations are **normal**; start tiny, add columns/tables incrementally. |
| **Speed of first keystroke saved** | Fastest on **one** machine. | Slightly more setup once; then saves are straightforward from both devices. |

**“Implement as I need”** does **not** require local-first files. It means **small vertical slices**: e.g. “one note field persisted remotely” before building full project entities.

### When **local JSON** (or localStorage) still makes sense

- **Spike / prototype** on a **single** machine for a few days, with **no** expectation that those files are the final source of truth.
- **Offline draft** layer **later** (optional): local queue + sync when online — explicitly a phase-2 feature, not required for your current priorities.

### Middle ground (acceptable but optional)

- **Local JSON export** as **backup** or **debug** while **remote remains canonical** — useful, not a substitute for a shared DB across machines.

### Lexical ↔ storage

- Persist **Lexical editor state** as **JSON** (serialized editor state) in a column, **or** derive plain text / HTML for search later.
- If the schema is **only** `content_json` at first, migrating to richer tables later does **not** require throwing away Lexical — you mostly **add** tables and foreign keys around the same blob or split fields when ready.

---

## Summary

| Topic | Decision |
|--------|-----------|
| **Editor** | **Lexical**, extended **as needed**. |
| **Persistence** | **Remote / hosted from the start** with **minimal schema**; avoid **local JSON as primary** if you truly need **two computers** in sync. |
| **Local-first files** | Optional **spike** or **export**; not the main path for shared multi-machine use. |
| **Offline** | **Later**; not blocking initial remote saves. |

---

## Related docs

- [REQUIREMENTS_AND_DECISIONS.md](./REQUIREMENTS_AND_DECISIONS.md) — product priorities and stack direction.
- [instruction.md](./instruction.md) — git / work log expectations.
- [workLog.md](./workLog.md) — dated log of changes (newest first).
