"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createChannel } from "@/app/actions/channels";
import { CHANNEL_CATEGORIES } from "@/lib/channel-categories";

export function NewChannelForm({ onCancel }: { onCancel: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const form = e.currentTarget;
    const fd = new FormData(form);

    setPending(true);
    try {
      const result = await createChannel(fd);
      if (!result.ok) {
        setError(result.error);
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
    <form
      onSubmit={onSubmit}
      className="rounded-lg border border-border bg-surface p-6 shadow-soft"
    >
      <div className="mb-6">
        <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
          New channel
        </div>
        <h1 className="mt-2 font-serif text-h2 tracking-[-0.01em] text-foreground">
          Create a channel
        </h1>
        <p className="mt-2 text-body leading-7 text-muted">
          A channel is a top-level space (like a book or workspace). You can refine
          fields later.
        </p>
      </div>

      <div className="space-y-5">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-label font-medium text-foreground"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            placeholder="e.g. Korea protocol notes"
            className="w-full rounded-md border border-border bg-paper px-3 py-2 text-ui text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
          />
        </div>

        <div>
          <label
            htmlFor="category"
            className="mb-1.5 block text-label font-medium text-foreground"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            required
            defaultValue={CHANNEL_CATEGORIES[0]}
            className="w-full rounded-md border border-border bg-paper px-3 py-2 text-ui text-foreground shadow-sm outline-none ring-accent/30 focus:ring-2 dark:bg-paper-light/30"
          >
            {CHANNEL_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label
            htmlFor="brief_note"
            className="mb-1.5 block text-label font-medium text-foreground"
          >
            Brief note
          </label>
          <textarea
            id="brief_note"
            name="brief_note"
            rows={4}
            placeholder="Why this channel exists, or a one-line charter."
            className="w-full resize-y rounded-md border border-border bg-paper px-3 py-2 text-body leading-7 text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
          />
        </div>
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
          {pending ? "Saving…" : "Save"}
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
  );
}
