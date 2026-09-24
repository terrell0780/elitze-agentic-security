"use client";

import { useLayoutEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

type GlobalThemeToggleProps = {
  embedded?: boolean;
};

export default function GlobalThemeToggle({ embedded = false }: GlobalThemeToggleProps) {
  const pathname = usePathname();
  const [light, setLight] = useState(false);

  useLayoutEffect(() => {
    const stored = window.localStorage.getItem("elitze-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const nextLight = stored ? stored === "light" : prefersLight;
    queueMicrotask(() => setLight(nextLight));
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
  }, []);

  if (pathname === "/" && !embedded) return null;

  function toggle() {
    const nextLight = !light;
    setLight(nextLight);
    document.documentElement.dataset.theme = nextLight ? "light" : "dark";
    window.localStorage.setItem("elitze-theme", nextLight ? "light" : "dark");
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
      title={`Switch to ${light ? "dark" : "light"} mode`}
      className={embedded
        ? "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel)] text-[var(--muted-strong)] shadow-lg transition hover:border-[var(--border-strong)]"
        : "fixed right-4 top-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted-strong)] shadow-lg transition hover:border-[var(--border-strong)]"}
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
