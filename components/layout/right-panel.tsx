"use client";

export function RightPanel({
  contextTitle = "Workspace",
  contextDetail = "Create a channel or pick one from the list.",
}: {
  contextTitle?: string;
  contextDetail?: string;
}) {
  const tabs = ["Notes", "Links", "AI"];

  return (
    <aside className="hidden w-[300px] shrink-0 border-l border-border bg-paper xl:flex xl:flex-col">
      <div className="border-b border-border px-6 py-6">
        <div className="font-serif text-h4 text-foreground">Praxis</div>
        <div className="mt-2 flex flex-wrap gap-2">
          {tabs.map((tab, index) => (
            <div
              key={tab}
              className={`rounded-full px-3 py-1 text-label ${
                index === 0
                  ? "bg-black/6 text-foreground dark:bg-white/10"
                  : "text-muted"
              }`}
            >
              {tab}
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 px-6 py-6">
        <div className="rounded-lg border border-border bg-surface p-4 shadow-soft">
          <div className="text-micro font-semibold uppercase tracking-[0.08em] text-muted">
            Context
          </div>
          <div className="mt-3 font-serif text-h4 text-foreground">Channel lens</div>
          <p className="mt-3 text-body leading-7 text-muted">
            This panel will hold related notes, links, and signals for the selected
            channel.
          </p>
          <div className="mt-5 space-y-3">
            <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
              <div className="text-label text-muted">Current</div>
              <div className="mt-1 text-ui font-medium text-foreground">
                {contextTitle}
              </div>
            </div>
            <div className="rounded-md border border-border bg-paper px-3 py-3 dark:bg-paper-light/50">
              <div className="text-label text-muted">Focus</div>
              <div className="mt-1 text-ui font-medium text-foreground">
                {contextDetail}
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
