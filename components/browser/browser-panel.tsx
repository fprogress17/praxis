"use client";

import { useEffect, useMemo, useState } from "react";

type BrowserState = {
  currentUrl: string;
  history: string[];
};

const EMPTY_STATE: BrowserState = {
  currentUrl: "",
  history: [],
};

function normalizeUrl(raw: string): string {
  const v = raw.trim();
  if (!v) return "";
  if (/^https?:\/\//i.test(v)) return v;
  return `https://${v}`;
}

export function BrowserPanel({ scopeKey }: { scopeKey: string }) {
  const storageKey = useMemo(() => `praxis:browser:${scopeKey}`, [scopeKey]);
  const [input, setInput] = useState("");
  const [state, setState] = useState<BrowserState>(EMPTY_STATE);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (!saved) {
        setInput("");
        setState(EMPTY_STATE);
        return;
      }
      const parsed = JSON.parse(saved) as Partial<BrowserState>;
      const currentUrl = typeof parsed.currentUrl === "string" ? parsed.currentUrl : "";
      const history = Array.isArray(parsed.history)
        ? parsed.history.filter((x): x is string => typeof x === "string")
        : [];
      setState({ currentUrl, history });
      setInput(currentUrl);
    } catch {
      setInput("");
      setState(EMPTY_STATE);
    }
  }, [storageKey]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch {
      // Ignore quota/privacy-mode errors.
    }
  }, [storageKey, state]);

  function openUrl(raw: string) {
    const url = normalizeUrl(raw);
    if (!url) return;
    setInput(url);
    setState((prev) => ({
      currentUrl: url,
      history: [url, ...prev.history.filter((h) => h !== url)].slice(0, 12),
    }));
  }

  return (
    <div className="space-y-3">
      <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">Browser</div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          openUrl(input);
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="https://example.com"
          className="min-w-0 flex-1 rounded-md border border-border bg-paper px-2.5 py-1.5 text-ui text-foreground shadow-sm outline-none ring-accent/30 placeholder:text-muted focus:ring-2 dark:bg-paper-light/30"
        />
        <button
          type="submit"
          className="shrink-0 rounded-md border border-border bg-surface px-3 py-1.5 text-meta font-medium text-foreground hover:bg-black/4 dark:hover:bg-white/5"
        >
          Go
        </button>
      </form>

      {state.currentUrl ? (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <a
              href={state.currentUrl}
              target="_blank"
              rel="noreferrer"
              className="min-w-0 truncate text-label text-muted hover:text-foreground"
            >
              {state.currentUrl}
            </a>
            <a
              href={state.currentUrl}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 rounded-md border border-border px-2 py-1 text-label text-foreground hover:bg-black/4 dark:hover:bg-white/5"
            >
              Open
            </a>
          </div>
          <div className="h-[360px] overflow-hidden rounded-md border border-border bg-paper dark:bg-paper-light/20">
            <iframe title="Praxis browser" src={state.currentUrl} className="h-full w-full" />
          </div>
          <p className="text-label text-muted">
            Some websites block embedding due to security headers. Use Open for those pages.
          </p>
        </div>
      ) : (
        <p className="rounded-md border border-dashed border-border px-3 py-3 text-meta text-muted">
          Enter a URL and press Go.
        </p>
      )}

      {state.history.length > 0 ? (
        <div className="space-y-1">
          <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">Recent</div>
          <ul className="space-y-1">
            {state.history.map((url) => (
              <li key={url}>
                <button
                  type="button"
                  onClick={() => openUrl(url)}
                  className="w-full truncate rounded-md border border-border bg-paper px-2 py-1 text-left text-label text-muted hover:bg-black/4 hover:text-foreground dark:bg-paper-light/30 dark:hover:bg-white/5"
                >
                  {url}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
