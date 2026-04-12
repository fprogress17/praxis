"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { createNote, updateNote } from "@/app/actions/notes";
import type { NoteRow } from "@/lib/types/note";

export function NotesSection({
  channelId,
  notes,
  supabaseConfigured,
}: {
  channelId: string | null;
  notes: NoteRow[];
  supabaseConfigured: boolean;
}) {
  const router = useRouter();
  const [draft, setDraft] = useState<{
    id?: string;
    title: string;
    body: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setDraft(null);
    setError(null);
  }, [channelId]);

  if (!supabaseConfigured) {
    return (
      <p className="text-meta leading-6 text-muted">
        Configure Supabase in <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.local</code>{" "}
        to use notes.
      </p>
    );
  }

  if (!channelId) {
    return (
      <p className="text-meta leading-6 text-muted">
        Select a channel to add notes for this workspace.
      </p>
    );
  }

  const openNew = () => {
    setError(null);
    setDraft({ title: "", body: "" });
  };

  const openEdit = (n: NoteRow) => {
    setError(null);
    setDraft({ id: n.id, title: n.title, body: n.body });
  };

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft || !channelId) return;
    setError(null);
    setPending(true);
    try {
      const cid = channelId;
      const result = draft.id
        ? await updateNote(
            (() => {
              const fd = new FormData();
              fd.set("id", draft.id!);
              fd.set("title", draft.title.trim());
              fd.set("body", draft.body);
              return fd;
            })(),
          )
        : await createNote(
            (() => {
              const fd = new FormData();
              fd.set("channel_id", cid);
              fd.set("title", draft.title.trim());
              fd.set("body", draft.body);
              return fd;
            })(),
          );

      if (!result.ok) {
        setError(result.error);
        return;
      }
      setDraft(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <span className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
          Notes
        </span>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-paper text-foreground shadow-sm transition-colors hover:bg-black/4 dark:hover:bg-white/5"
          aria-label="Add note"
          title="Add note"
        >
          <Plus className="h-4 w-4" strokeWidth={2} />
        </button>
      </div>

      {draft ? (
        <form
          onSubmit={onSubmit}
          className="rounded-lg border border-border bg-surface p-3 shadow-soft"
        >
          <div className="space-y-3">
            <div>
              <label
                htmlFor="note-title"
                className="mb-1 block text-label font-medium text-foreground"
              >
                Title
              </label>
              <input
                id="note-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                placeholder="Note title"
                className="w-full rounded-md border border-border bg-paper px-2.5 py-1.5 text-ui text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
              />
            </div>
            <div>
              <label
                htmlFor="note-body"
                className="mb-1 block text-label font-medium text-foreground"
              >
                Note
              </label>
              <textarea
                id="note-body"
                value={draft.body}
                onChange={(e) => setDraft((d) => (d ? { ...d, body: e.target.value } : d))}
                rows={5}
                placeholder="Write the note…"
                className="w-full resize-y rounded-md border border-border bg-paper px-2.5 py-1.5 text-meta leading-6 text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
              />
            </div>
          </div>

          {error ? (
            <p className="mt-3 rounded-md border border-red-200 bg-red-50 px-2.5 py-1.5 text-meta text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
              {error}
            </p>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-md bg-ink px-3 py-1.5 text-meta font-medium text-paper-light transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent dark:text-paper"
            >
              {pending ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDraft(null)}
              className="rounded-md border border-border bg-transparent px-3 py-1.5 text-meta font-medium text-foreground hover:bg-black/4 dark:hover:bg-white/5"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}

      <ul className="space-y-2">
        {notes.length === 0 ? (
          <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-meta text-muted">
            No notes yet. Use + to add one.
          </li>
        ) : (
          notes.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onClick={() => openEdit(n)}
                className={`w-full rounded-md border px-3 py-2.5 text-left transition-colors ${
                  draft?.id === n.id
                    ? "border-accent bg-black/4 dark:bg-white/10"
                    : "border-border bg-paper hover:bg-black/4 dark:bg-paper-light/30 dark:hover:bg-white/5"
                }`}
              >
                <div className="font-medium text-ui text-foreground line-clamp-2">
                  {n.title.trim() || "Untitled"}
                </div>
                {n.body.trim() ? (
                  <div className="mt-1 line-clamp-2 text-meta text-muted">{n.body}</div>
                ) : null}
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
