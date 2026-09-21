"use client";

import { useEffect } from "react";

/**
 * Keeps accessible names aligned with visible labels for interactive controls.
 * This is intentionally conservative: controls without an aria-label are left alone,
 * and icon-only controls retain their explicit accessible name.
 */
export default function AccessibilityRepair() {
  useEffect(() => {
    const sync = () => {
      document.querySelectorAll<HTMLElement>("a[aria-label],button[aria-label]").forEach((element) => {
        const label = element.getAttribute("aria-label");
        if (!label) return;
        const visible = Array.from(element.childNodes)
          .filter((node) => node.nodeType === Node.TEXT_NODE)
          .map((node) => node.textContent ?? "")
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        if (!visible) return;
        const normalizedLabel = label.toLocaleLowerCase();
        const normalizedVisible = visible.toLocaleLowerCase();
        if (!normalizedLabel.includes(normalizedVisible)) {
          element.setAttribute("aria-label", `${visible} — ${label}`);
        }
      });
    };

    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["aria-label"] });
    return () => observer.disconnect();
  }, []);

  return null;
}
