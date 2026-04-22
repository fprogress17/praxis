"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createNote, deleteNote, updateNote } from "@/app/actions/notes";
import {
  createWorkspaceNote,
  deleteWorkspaceNote,
  updateWorkspaceNote,
} from "@/app/actions/workspace-notes";
import type { NoteRow } from "@/lib/types/note";
import type { WorkspaceNoteRow } from "@/lib/types/workspace-note";

export type NotesSectionProps =
  | {
      scope: "workspace";
      notes: WorkspaceNoteRow[];
      dataConfigured: boolean;
    }
  | {
      scope: "channel" | "video";
      channelId: string;
      videoId: string | null;
      notes: NoteRow[];
      dataConfigured: boolean;
    };

export function NotesSection(props: NotesSectionProps) {
  const router = useRouter();
  const [draft, setDraft] = useState<{
    id?: string;
    title: string;
    body: string;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const channelKey = props.scope !== "workspace" ? props.channelId : "";
  const videoKey = props.scope !== "workspace" ? props.videoId ?? "" : "";
  const panelKey = useMemo(() => {
    if (props.scope === "workspace") return "workspace";
    return `${channelKey}:${videoKey}`;
  }, [props.scope, channelKey, videoKey]);

  useEffect(() => {
    setDraft(null);
    setError(null);
  }, [panelKey]);

  if (!props.dataConfigured) {
    return (
      <p className="text-meta leading-6 text-muted">
        Configure <code className="rounded bg-black/5 px-1 dark:bg-white/10">DATABASE_URL</code> in{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.local</code> to use notes.
      </p>
    );
  }

  const scopeSubtitle =
    props.scope === "workspace"
      ? "All channels"
      : props.scope === "video"
        ? "This video"
        : "Whole channel";

  const listNotes = props.notes;

  const openNew = () => {
    setError(null);
    setDraft({ title: "", body: "" });
  };

  const openEdit = (n: { id: string; title: string; body: string }) => {
    setError(null);
    setDraft({ id: n.id, title: n.title, body: n.body });
  };

  async function handleDelete(noteId: string) {
    if (!confirm("Delete this note?")) return;
    setError(null);
    const fd = new FormData();
    fd.set("id", noteId);
    setDeletingId(noteId);
    try {
      const result =
        props.scope === "workspace"
          ? await deleteWorkspaceNote(fd)
          : await deleteNote(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (draft?.id === noteId) {
        setDraft(null);
      }
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;
    setError(null);
    setPending(true);
    try {
      if (props.scope === "workspace") {
        const result = draft.id
          ? await updateWorkspaceNote(
              (() => {
                const fd = new FormData();
                fd.set("id", draft.id!);
                fd.set("title", draft.title.trim());
                fd.set("body", draft.body);
                return fd;
              })(),
            )
          : await createWorkspaceNote(
              (() => {
                const fd = new FormData();
                fd.set("title", draft.title.trim());
                fd.set("body", draft.body);
                return fd;
              })(),
            );
        if (!result.ok) {
          setError(result.error);
          return;
        }
      } else {
        if (!props.channelId) return;
        const cid = props.channelId;
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
                if (props.videoId) {
                  fd.set("video_id", props.videoId);
                }
                return fd;
              })(),
            );
        if (!result.ok) {
          setError(result.error);
          return;
        }
      }
      setDraft(null);
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            Notes
          </div>
          <p className="mt-0.5 text-label text-muted">{scopeSubtitle}</p>
        </div>
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
        {listNotes.length === 0 ? (
          <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-meta text-muted">
            No notes yet. Use + to add one.
          </li>
        ) : (
          listNotes.map((n) => (
            <li key={n.id}>
              <div
                className={`flex min-h-[2.75rem] items-stretch gap-0 overflow-hidden rounded-md border transition-colors ${
                  draft?.id === n.id
                    ? "border-accent bg-black/4 dark:bg-white/10"
                    : "border-border bg-paper hover:bg-black/4 dark:bg-paper-light/30 dark:hover:bg-white/5"
                }`}
              >
                <button
                  type="button"
                  onClick={() => openEdit(n)}
                  className="min-w-0 flex-1 px-3 py-2.5 text-left"
                >
                  <div className="font-medium text-ui text-foreground line-clamp-2">
                    {n.title.trim() || "Untitled"}
                  </div>
                  {n.body.trim() ? (
                    <div className="mt-1 line-clamp-2 text-meta text-muted">{n.body}</div>
                  ) : null}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(n.id)}
                  disabled={deletingId !== null}
                  className="flex shrink-0 items-center justify-center border-l border-border/60 px-2 text-muted transition-colors hover:bg-red-500/10 hover:text-red-800 disabled:opacity-50 dark:hover:text-red-300"
                  aria-label="Delete note"
                  title="Delete note"
                >
                  <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                </button>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
