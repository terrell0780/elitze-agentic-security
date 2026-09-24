"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { usePathname } from "next/navigation";

export default function GlobalThemeToggle() {
  const pathname = usePathname();
  const [light, setLight] = useState(false);

  useEffect(() => {
    const initial = window.setTimeout(() => {
      const stored = window.localStorage.getItem("elitze-theme");
      const nextLight = stored ? stored === "light" : window.matchMedia("(prefers-color-scheme: light)").matches;
      setLight(nextLight);
      document.documentElement.dataset.theme = nextLight ? "light" : "dark";
      window.localStorage.setItem("elitze-theme", nextLight ? "light" : "dark");
    }, 0);
    return () => window.clearTimeout(initial);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = light ? "light" : "dark";
    window.localStorage.setItem("elitze-theme", light ? "light" : "dark");
  }, [light]);

  if (pathname === "/") return null;

  function toggle() {
    setLight((current) => !current);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${light ? "dark" : "light"} mode`}
      title={`Switch to ${light ? "dark" : "light"} mode`}
      className="fixed right-4 top-4 z-[60] inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--panel-strong)] text-[var(--muted-strong)] shadow-lg transition hover:border-[var(--border-strong)]"
    >
      {light ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
}
