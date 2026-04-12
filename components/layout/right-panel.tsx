"use client";

import { useState } from "react";
import { NotesSection } from "@/components/notes/notes-section";
import type { NoteRow } from "@/lib/types/note";

const TABS = ["Notes", "Links", "AI"] as const;
type TabId = (typeof TABS)[number];

export function RightPanel({
  contextTitle = "Workspace",
  contextDetail = "Create a channel or pick one from the list.",
  channelId = null,
  channelNotes = [],
  supabaseConfigured = false,
}: {
  contextTitle?: string;
  contextDetail?: string;
  channelId?: string | null;
  channelNotes?: NoteRow[];
  supabaseConfigured?: boolean;
}) {
  const [tab, setTab] = useState<TabId>("Notes");

  return (
    <aside className="hidden w-[300px] shrink-0 border-l border-border bg-paper xl:flex xl:flex-col">
      <div className="border-b border-border px-6 py-6">
        <div className="font-serif text-h4 text-foreground">Praxis</div>
        <div className="mt-2 flex flex-wrap gap-2" role="tablist" aria-label="Right panel">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-3 py-1 text-label transition-colors ${
                tab === t
                  ? "bg-black/6 text-foreground dark:bg-white/10"
                  : "text-muted hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {tab === "Notes" ? (
            <NotesSection
              channelId={channelId}
              notes={channelNotes}
              supabaseConfigured={supabaseConfigured}
            />
          ) : null}

          {tab === "Links" ? (
            <p className="text-meta leading-6 text-muted">Links for this channel will live here.</p>
          ) : null}

          {tab === "AI" ? (
            <p className="text-meta leading-6 text-muted">AI-assisted signals for this channel will live here.</p>
          ) : null}
        </div>

        <div className="shrink-0 border-t border-border px-6 py-6">
          <div className="rounded-lg border border-border bg-surface p-4 shadow-soft">
            <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
              Context
            </div>
            <div className="mt-3 font-serif text-h4 text-foreground">Channel lens</div>
            <p className="mt-3 text-body leading-7 text-muted">
              Notes are scoped to the selected channel. Links and AI stay placeholders for now.
            </p>
            <div className="mt-5 space-y-3">
              <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
                <div className="text-label text-muted">Current</div>
                <div className="mt-1 text-ui font-medium text-foreground">{contextTitle}</div>
              </div>
              <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
                <div className="text-label text-muted">Focus</div>
                <div className="mt-1 text-ui font-medium text-foreground">{contextDetail}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
