"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { createLink, deleteLink, updateLink } from "@/app/actions/links";
import type { LinkRow } from "@/lib/types/link";

type LinksSectionProps = {
  scope: "workspace" | "channel" | "video";
  channelId: string | null;
  videoId: string | null;
  links: LinkRow[];
  dataConfigured: boolean;
};

function displayTitle(link: LinkRow) {
  if (link.title.trim()) return link.title;
  try {
    return new URL(link.url).hostname;
  } catch {
    return link.url;
  }
}

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "";
  }
}

export function LinksSection({
  scope,
  channelId,
  videoId,
  links,
  dataConfigured,
}: LinksSectionProps) {
  const router = useRouter();
  const panelKey = `${scope}:${channelId ?? ""}:${videoId ?? ""}`;
  const [draft, setDraft] = useState<{ id?: string; title: string; url: string; note: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const scopeSubtitle = scope === "workspace" ? "All channels" : scope === "video" ? "This video" : "Whole channel";
  const sortedLinks = useMemo(
    () => [...links].sort((a, b) => b.created_at.localeCompare(a.created_at)),
    [links],
  );

  useEffect(() => {
    setDraft(null);
    setError(null);
  }, [panelKey]);

  if (!dataConfigured) {
    return (
      <p className="text-meta leading-6 text-muted">
        Configure <code className="rounded bg-black/5 px-1 dark:bg-white/10">DATABASE_URL</code> in{" "}
        <code className="rounded bg-black/5 px-1 dark:bg-white/10">.env.local</code> to save links.
      </p>
    );
  }

  function openNew() {
    setError(null);
    setDraft({ title: "", url: "", note: "" });
  }

  function openEdit(link: LinkRow) {
    setError(null);
    setDraft({ id: link.id, title: link.title, url: link.url, note: link.note });
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft) return;

    const fd = new FormData();
    if (draft.id) fd.set("id", draft.id);
    if (channelId) fd.set("channel_id", channelId);
    if (scope === "video" && videoId) fd.set("video_id", videoId);
    fd.set("title", draft.title);
    fd.set("url", draft.url);
    fd.set("note", draft.note);

    setError(null);
    setPending(true);
    try {
      const result = draft.id ? await updateLink(fd) : await createLink(fd);
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

  async function onDelete(link: LinkRow) {
    if (!confirm(`Delete ${displayTitle(link)}?`)) return;
    const fd = new FormData();
    fd.set("id", link.id);
    setError(null);
    setDeletingId(link.id);
    try {
      const result = await deleteLink(fd);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      if (draft?.id === link.id) setDraft(null);
      router.refresh();
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            Links
          </div>
          <p className="mt-0.5 text-label text-muted">{scopeSubtitle}</p>
        </div>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-paper text-foreground shadow-sm transition-colors hover:bg-black/4 dark:hover:bg-white/5"
          aria-label="Add link"
          title="Add link"
        >
          <Plus className="h-4 w-4" strokeWidth={2} aria-hidden />
        </button>
      </div>

      {draft ? (
        <form onSubmit={onSubmit} className="rounded-lg border border-border bg-surface p-3 shadow-soft">
          <div className="space-y-3">
            <div>
              <label htmlFor="link-url" className="mb-1 block text-label font-medium text-foreground">
                URL
              </label>
              <input
                id="link-url"
                value={draft.url}
                onChange={(e) => setDraft((d) => (d ? { ...d, url: e.target.value } : d))}
                placeholder="https://youtube.com/..."
                required
                className="w-full rounded-md border border-border bg-paper px-2.5 py-1.5 text-ui text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
              />
            </div>
            <div>
              <label htmlFor="link-title" className="mb-1 block text-label font-medium text-foreground">
                Title
              </label>
              <input
                id="link-title"
                value={draft.title}
                onChange={(e) => setDraft((d) => (d ? { ...d, title: e.target.value } : d))}
                placeholder="Optional label"
                className="w-full rounded-md border border-border bg-paper px-2.5 py-1.5 text-ui text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
              />
            </div>
            <div>
              <label htmlFor="link-note" className="mb-1 block text-label font-medium text-foreground">
                Note
              </label>
              <textarea
                id="link-note"
                value={draft.note}
                onChange={(e) => setDraft((d) => (d ? { ...d, note: e.target.value } : d))}
                rows={4}
                placeholder="Why this source matters..."
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
              {pending ? "Saving..." : "Save"}
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

      {error && !draft ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-meta text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
          {error}
        </p>
      ) : null}

      <ul className="space-y-2">
        {sortedLinks.length === 0 ? (
          <li className="rounded-md border border-dashed border-border px-3 py-4 text-center text-meta text-muted">
            No links yet. Use + to save research sources, competitor videos, references, or URLs from Browser.
          </li>
        ) : (
          sortedLinks.map((link) => (
            <li key={link.id} className="rounded-md border border-border bg-paper p-3 dark:bg-paper-light/30">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex min-w-0 items-center gap-1.5 text-ui font-medium text-foreground hover:underline"
                  >
                    <span className="truncate">{displayTitle(link)}</span>
                    <ExternalLink className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  </a>
                  <div className="mt-1 truncate text-label text-muted">{link.url}</div>
                  {link.note.trim() ? (
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-meta leading-6 text-muted">
                      {link.note}
                    </p>
                  ) : null}
                  <div className="mt-2 text-label text-muted">{formatDate(link.created_at)}</div>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEdit(link)}
                    disabled={deletingId !== null}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-black/5 hover:text-foreground disabled:opacity-50 dark:hover:bg-white/10"
                    aria-label="Edit link"
                    title="Edit link"
                  >
                    <Pencil className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => void onDelete(link)}
                    disabled={deletingId !== null}
                    className="inline-flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-red-500/10 hover:text-red-800 disabled:opacity-50 dark:hover:text-red-300"
                    aria-label="Delete link"
                    title="Delete link"
                  >
                    <Trash2 className="h-3.5 w-3.5" strokeWidth={2} aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
