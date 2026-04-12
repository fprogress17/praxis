"use client";

import { Moon, Monitor, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div
        className={
          compact
            ? "h-9 w-9 shrink-0 rounded-md border border-border bg-paper dark:bg-paper-light/20"
            : "h-9 w-[5.5rem] rounded-md border border-border bg-paper dark:bg-paper-light/20"
        }
      />
    );
  }

  const cycle = () => {
    if (theme === "light") setTheme("dark");
    else if (theme === "dark") setTheme("system");
    else setTheme("light");
  };

  const Icon =
    theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;
  const label =
    theme === "light" ? "Light" : theme === "dark" ? "Dark" : "System";

  if (compact) {
    return (
      <button
        type="button"
        onClick={cycle}
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-paper text-foreground transition-colors hover:bg-black/4 dark:bg-paper-light/20 dark:hover:bg-white/10"
        title={`Theme: ${label} (click to cycle)`}
      >
        <Icon className="h-4 w-4 shrink-0" aria-hidden />
        <span className="sr-only">{label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={cycle}
      className="flex w-full items-center justify-center gap-2 rounded-md border border-border bg-paper px-3 py-2 text-label font-medium text-foreground transition-colors hover:bg-black/4 dark:bg-paper-light/20 dark:hover:bg-white/10"
      title={`Theme: ${label} (click to cycle)`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
    </button>
  );
}
