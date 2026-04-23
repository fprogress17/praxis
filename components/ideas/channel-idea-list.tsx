"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { IdeaRow } from "@/lib/types/idea";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function ChannelIdeaList({ ideas }: { ideas: IdeaRow[] }) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(idea: IdeaRow) {
    setError(null);
    setEditingId(idea.id);
    setDraft(idea.body);
  }

  function cancelEdit() {
    setEditingId(null);
    setDraft("");
    setError(null);
  }

  async function saveEdit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editingId) return;
    setError(null);
    setPending(true);
    try {
      const response = await fetch(`/api/ideas/${editingId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not save idea.");
        return;
      }
      cancelEdit();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete(ideaId: string) {
    if (!confirm("Delete this idea? This cannot be undone.")) {
      return;
    }
    setError(null);
    setDeletingId(ideaId);
    try {
      const response = await fetch(`/api/ideas/${ideaId}`, { method: "DELETE" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not delete idea.");
        return;
      }
      if (editingId === ideaId) {
        cancelEdit();
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  if (ideas.length === 0) {
    return null;
  }

  return (
    <section className="mt-10">
      <div className="mb-4 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
        Ideas
      </div>
      {error ? (
        <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-meta text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}
      <ul className="space-y-2">
        {ideas.map((idea) => {
          const isEditing = editingId === idea.id;
          const busy = pending && isEditing;
          const deleting = deletingId === idea.id;

          return (
            <li
              key={idea.id}
              className="rounded-lg border border-dashed border-border bg-surface/80 px-4 py-3 text-body leading-6 text-foreground shadow-sm"
            >
              {isEditing ? (
                <form onSubmit={saveEdit} className="space-y-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    rows={6}
                    className="w-full resize-y rounded-md border border-border bg-paper px-3 py-2 text-body leading-6 text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 dark:bg-paper-light/30"
                    disabled={busy}
                    aria-label="Edit idea"
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="submit"
                      disabled={busy || !draft.trim()}
                      className="rounded-md bg-ink px-3 py-1.5 text-label font-medium text-paper-light transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent dark:text-paper"
                    >
                      {busy ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      disabled={busy}
                      className="rounded-md border border-border px-3 py-1.5 text-label font-medium text-foreground hover:bg-black/4 dark:hover:bg-white/5"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="whitespace-pre-wrap">{idea.body}</p>
                  <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-label text-muted">{formatDate(idea.created_at)}</span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => startEdit(idea)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-label font-medium text-muted transition-colors hover:bg-black/5 hover:text-foreground disabled:opacity-50 dark:hover:bg-white/10"
                      >
                        <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(idea.id)}
                        disabled={deleting}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-label font-medium text-muted transition-colors hover:bg-red-500/10 hover:text-red-800 disabled:opacity-50 dark:hover:text-red-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                        {deleting ? "…" : "Delete"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
