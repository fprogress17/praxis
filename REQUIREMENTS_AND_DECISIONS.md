# Praxis — Requirements & decisions (browser-first iteration)

*Last updated: 2026-04-12*

This document records **what we want now**, **what we explicitly defer**, and **why we chose this path** over alternatives. It is a living note for the **`praxis-web`** effort; it does not replace a full product spec.

---

## 1. Product intent (unchanged in spirit)

Praxis is a **personal project memory system**: richer than a todo list — projects, progress history, failures/lessons, relationships, notes, resources, and timeline-style views **over time**.

For **this iteration**, we are **not** implementing the full original spec up front. We grow **basic functionality and UI first**, then add screens and features **as needed while using the app**.

---

## 2. Priorities (ordered)

1. **Quick and easy development** — ship small slices, iterate often.
2. **Nice, flexible UI** — any layout; willingness to refactor. **Implementation flexibility** matters more than freezing architecture on day one.
3. **Desktop-first in the browser** — primary use on Mac (later also laptop). **iOS comes later** as a **separate, minimal app** (e.g. quick idea capture), **not** the same UI or full feature set. **No need** to optimize the web stack for “one codebase with iPhone” right now; only choose a backend/API that a future native or hybrid iOS client **can** call.
4. **Shared data across machines** — one logical database / cloud backend so **desktop and laptop** see the same data (single user is fine to start).
5. **Connectivity** — **mostly online** is acceptable. **Offline-first** is **out of scope for v0**; may be reconsidered later (caching, local replica, PWA, etc.).

---

## 3. Delivery strategy

| Aspect | Decision |
|--------|----------|
| **First host** | **Browser only** — app runs as a normal web app (URL), not a native window. |
| **Later optional** | **Tauri (or similar)** may wrap the **same** frontend for dock icon, menus, file integration, etc. **No commitment** to Rust-heavy work until native features are actually needed. |
| **Spec** | **Iterative** — start minimal; add tables, routes, and UI **when the need appears**. Use migrations and small vertical slices. |

---

## 4. Alternatives considered & why we did not lead with them

### 4.1 SwiftUI + SwiftData + CloudKit (`Praxis_Swift`)

**Pros:** Native Mac/iOS feel; strong sync story inside Apple’s ecosystem; no custom server for sync.

**Cons for *current* goals:** Slower UI iteration if the fastest muscle memory is web tooling; ties full client to Apple; earlier plan assumed **big spec / full architecture** — **not** how we want to build **this** phase.

**Outcome:** **Parked as reference** (`../Praxis_Swift/`). **Active path:** web client under this folder + hosted backend.

### 4.2 Tauri + React from day one

**Pros:** Desktop window, dock, eventual native hooks; still web UI.

**Cons:** Extra toolchain (Rust, Tauri config, capabilities) before the first line of product logic; slightly higher bootstrap cost than pure browser.

**Outcome:** **Defer.** Start **browser-first**; add Tauri **when** desktop shell or OS integration is worth the complexity.

### 4.3 Wails + web frontend

**Pros:** Go-backed desktop shell.

**Cons:** No first-class iOS story; Go in the loop without a strong personal preference for it; same “wrapper complexity” as Tauri for v0.

**Outcome:** **Not chosen** for the initial path.

### 4.4 Next.js vs “React + Vite SPA”

Both are viable **for the web UI**.

- **Next.js** — convenient if you want **hosting, auth, API routes, and SSR/RSC** in one repo on Vercel (or similar).
- **Vite + React** — very light; often pairs with a **separate** API or **BaaS** (e.g. Supabase client-only).

**Outcome:** **Not locked in this document.** Pick based on whether you want **framework + deployment** bundled (Next) vs **minimal SPA** (Vite). Either can move behind Tauri later if the UI stays a normal web app.

### 4.5 Backend / sync

**Requirement:** Shared DB across **two computers**, **online-first**.

**Implication:** A **hosted** database (or BaaS) with auth (even single-user) beats **local-only SQLite** on one machine.

**Options to evaluate when scaffolding:** Supabase, Neon + small API, Firebase, etc. **Choose one** and keep the client **thin** so a future **minimal iOS app** can use the same API.

---

## 5. Non-goals (for now)

- Full feature parity with the original Praxis spec on day one.
- Offline-first / local-only as the source of truth.
- Same app on iPhone as on desktop (iPhone is **later**, **different** product slice).
- Team collaboration, multi-tenant productization (unless explicitly added later).

---

## 6. Practical notes for implementation

- **Abstract OS-specific behavior** when you can (e.g. “export file”, “pick file”) so a future **Tauri** layer can swap implementations without rewriting the whole UI.
- **Auth & storage:** Prefer patterns that work in both **browser** and **embedded WebView** (Tauri), to avoid cookie/session surprises later.
- **`instruction.md`:** Add your own short commands (install, dev, env vars, deploy) in this folder when you create the repo skeleton.

---

## 7. Folder layout (this repo area)

```
Praxis/
├── Praxis_Swift/          # Native SwiftUI experiment (reference)
└── praxis-web/            # Browser-first app + docs (this folder)
    ├── README.md
    ├── REQUIREMENTS_AND_DECISIONS.md
    └── instruction.md     # (you add)
```

---

## 8. Summary one-liner

**Build Praxis as an iterative, browser-first web app backed by cloud data for multi-machine use; keep UI/data boundaries clean for an optional Tauri shell and a future minimal iOS client; defer offline-first and full spec.**
