"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { ArrowLeft, LaptopMinimal, Settings2, TabletSmartphone } from "lucide-react";
import { apiUrl } from "@/lib/api/url";
import type { DesktopLanStatus } from "@/lib/server/desktop-settings";

export function SettingsClient({
  initialStatus,
}: {
  initialStatus: DesktopLanStatus;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateShareOnLocalNetwork(nextValue: boolean) {
    setError(null);
    setNotice(null);
    setStatus((current) => ({ ...current, shareOnLocalNetwork: nextValue }));

    startTransition(async () => {
      try {
        const response = await fetch(apiUrl("/api/settings/desktop"), {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ shareOnLocalNetwork: nextValue }),
        });
        const result = (await response.json()) as
          | ({ ok: true; restartRequired: boolean } & DesktopLanStatus)
          | { ok: false; error?: string };

        if (!response.ok || !result.ok) {
          throw new Error(result.ok ? "Could not save settings." : result.error || "Could not save settings.");
        }

        setStatus(result);
        setNotice("Saved. Quit and reopen Praxis to apply the network-sharing change.");
      } catch (cause) {
        setStatus((current) => ({ ...current, shareOnLocalNetwork: !nextValue }));
        setError(cause instanceof Error ? cause.message : "Could not save settings.");
      }
    });
  }

  return (
    <main className="min-h-screen bg-paper px-4 py-6 text-foreground sm:px-6 lg:px-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-ui font-medium shadow-soft transition-colors hover:bg-black/4 dark:hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" strokeWidth={1.75} />
            Back
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-2 text-meta text-muted shadow-soft">
            <Settings2 className="h-4 w-4" strokeWidth={1.75} />
            Settings
          </div>
        </div>

        <section className="rounded-[24px] border border-border bg-surface p-5 shadow-lift sm:p-7">
          <div className="mb-6">
            <h1 className="font-serif text-display leading-none tracking-[-0.04em] text-foreground">
              Desktop Settings
            </h1>
            <p className="mt-3 max-w-2xl text-body leading-7 text-muted">
              Configure how Praxis is shared from your Mac. Local network sharing is on by
              default so the same workspace can be opened from an iPad on Wi-Fi.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-paper p-4 shadow-soft sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="text-h4 font-semibold text-foreground">Share on local network</div>
                <p className="max-w-xl text-body leading-7 text-muted">
                  When enabled, Praxis listens on your Mac’s Wi-Fi address so Safari on iPad can
                  open the same app.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={status.shareOnLocalNetwork}
                disabled={isPending}
                onClick={() => updateShareOnLocalNetwork(!status.shareOnLocalNetwork)}
                className={`relative inline-flex h-8 w-15 shrink-0 items-center rounded-full border transition-colors ${
                  status.shareOnLocalNetwork
                    ? "border-accent bg-accent/90"
                    : "border-border bg-border"
                } ${isPending ? "opacity-70" : ""}`}
              >
                <span
                  className={`absolute top-0.5 h-6.5 w-6.5 rounded-full bg-paper shadow-soft transition-transform ${
                    status.shareOnLocalNetwork ? "translate-x-7" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <InfoCard
                icon={<LaptopMinimal className="h-4 w-4" strokeWidth={1.75} />}
                label="Mac IP"
                value={status.macIp ?? "Unavailable"}
                hint="Use this address to confirm your Mac is on the same Wi-Fi network as iPad."
              />
              <InfoCard
                icon={<TabletSmartphone className="h-4 w-4" strokeWidth={1.75} />}
                label="iPad URL"
                value={status.ipadUrl ?? "Unavailable"}
                hint={
                  status.shareOnLocalNetwork
                    ? "Open this in Safari on iPad while both devices are on the same Wi-Fi."
                    : "Sharing is off. Turn it on and reopen Praxis to use this URL."
                }
              />
            </div>

            <p className="mt-5 text-meta leading-6 text-muted">
              Changes are saved immediately but require quitting and reopening Praxis to apply the
              new network bind mode.
            </p>

            {notice ? <p className="mt-3 text-meta font-medium text-accent">{notice}</p> : null}
            {error ? <p className="mt-3 text-meta font-medium text-red-700">{error}</p> : null}
          </div>
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface px-4 py-4 shadow-soft">
      <div className="mb-2 inline-flex items-center gap-2 text-meta font-medium uppercase tracking-[0.08em] text-muted">
        {icon}
        {label}
      </div>
      <div className="break-all font-mono text-ui font-semibold text-foreground">{value}</div>
      <p className="mt-2 text-meta leading-6 text-muted">{hint}</p>
    </div>
  );
}
