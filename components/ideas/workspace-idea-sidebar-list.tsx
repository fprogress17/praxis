"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Trash2 } from "lucide-react";
import type { WorkspaceIdeaRow } from "@/lib/types/workspace-idea";

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

export function WorkspaceIdeaSidebarList({
  ideas,
  embedded,
}: {
  ideas: WorkspaceIdeaRow[];
  /** Omit top border when already inside a bordered panel (e.g. mobile nav). */
  embedded?: boolean;
}) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function startEdit(idea: WorkspaceIdeaRow) {
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
      const response = await fetch(`/api/workspace-ideas/${editingId}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({ body: draft.trim() }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not save workspace idea.");
        return;
      }
      cancelEdit();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  async function onDelete(ideaId: string) {
    if (!confirm("Delete this idea?")) return;
    setError(null);
    setDeletingId(ideaId);
    try {
      const response = await fetch(`/api/workspace-ideas/${ideaId}`, { method: "DELETE" });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not delete workspace idea.");
        return;
      }
      if (editingId === ideaId) cancelEdit();
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className={embedded ? "pt-2" : "mt-5 border-t border-border pt-4"}>
      <div className="mb-2 px-2 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
        Channel ideas
      </div>
      <p className="mb-3 px-2 text-meta leading-snug text-muted">
        For channels you haven’t created yet — not the same as ideas inside a channel.
      </p>
      {error ? (
        <p className="mb-2 rounded-md border border-red-200 bg-red-50 px-2 py-1.5 text-label text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}
      {ideas.length === 0 ? (
        <p className="px-2 text-meta text-muted">None yet — tap <strong className="text-foreground">Idea</strong> above.</p>
      ) : (
        <ul className="space-y-2">
          {ideas.map((idea) => {
            const isEditing = editingId === idea.id;
            const busy = pending && isEditing;
            const deleting = deletingId === idea.id;

            return (
              <li
                key={idea.id}
                className="rounded-md border border-dashed border-border bg-surface/90 px-2.5 py-2 text-meta leading-snug text-foreground"
              >
                {isEditing ? (
                  <form onSubmit={saveEdit} className="space-y-2">
                    <textarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      rows={4}
                      className="w-full resize-y rounded border border-border bg-paper px-2 py-1.5 text-meta leading-relaxed outline-none ring-accent/30 focus:ring-2 dark:bg-paper-light/30"
                      disabled={busy}
                      aria-label="Edit channel idea"
                    />
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="submit"
                        disabled={busy || !draft.trim()}
                        className="rounded bg-ink px-2 py-1 text-label font-medium text-paper-light dark:bg-accent dark:text-paper"
                      >
                        {busy ? "…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        disabled={busy}
                        className="rounded border border-border px-2 py-1 text-label"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <>
                    <p className="line-clamp-4 whitespace-pre-wrap">{idea.body}</p>
                    <div className="mt-1.5 flex items-center justify-between gap-1">
                      <span className="text-label text-muted">{formatDate(idea.created_at)}</span>
                      <div className="flex shrink-0 items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => startEdit(idea)}
                          disabled={deleting}
                          className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-label text-muted hover:bg-black/5 hover:text-foreground dark:hover:bg-white/10"
                        >
                          <Pencil className="h-3 w-3" strokeWidth={2} aria-hidden />
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(idea.id)}
                          disabled={deleting}
                          className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-label text-muted hover:bg-red-500/10 hover:text-red-800 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-3 w-3" strokeWidth={2} aria-hidden />
                          {deleting ? "…" : "Del"}
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
