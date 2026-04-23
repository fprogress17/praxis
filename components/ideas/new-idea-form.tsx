"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function NewIdeaForm({
  channelId,
  channelTitle,
  onCancel,
}: {
  channelId: string;
  channelTitle: string;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;

    setPending(true);
    try {
      const response = await fetch("/api/ideas", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          channelId,
          body: String(new FormData(form).get("body") ?? ""),
        }),
      });
      const result = (await response.json()) as { ok: boolean; error?: string };
      if (!result.ok) {
        setError(result.error ?? "Could not create idea.");
        return;
      }
      form.reset();
      onCancel();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mt-8">
      <div className="mb-4 text-micro font-semibold uppercase tracking-[0.08em] text-muted">
        New idea
      </div>
      <form
        key={channelId}
        onSubmit={onSubmit}
        className="rounded-lg border border-border bg-surface p-6 shadow-soft"
      >
        <input type="hidden" name="channel_id" value={channelId} />
        <p className="mb-5 text-meta text-muted">
          Channel: <span className="font-medium text-foreground">{channelTitle}</span>
        </p>

        <div>
          <label
            htmlFor="idea-body"
            className="mb-1.5 block text-label font-medium text-foreground"
          >
            Idea
          </label>
          <textarea
            id="idea-body"
            name="body"
            required
            rows={10}
            placeholder="Rough thought, angle, or topic to develop later…"
            className="w-full resize-y rounded-md border border-border bg-paper px-3 py-2 text-body leading-7 text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
          />
        </div>

        {error ? (
          <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-meta text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-100">
            {error}
          </p>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-ink px-4 py-2 text-ui font-medium text-paper-light transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-accent dark:text-paper"
          >
            {pending ? "Saving…" : "Save idea"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="rounded-md border border-border bg-transparent px-4 py-2 text-ui font-medium text-foreground hover:bg-black/4 dark:hover:bg-white/5"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
