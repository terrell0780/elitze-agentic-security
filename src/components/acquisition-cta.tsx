"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackElitzeEvent, type ElitzeAnalyticsEvent } from "@/lib/analytics-events";

type Props = {
  href: string;
  event: ElitzeAnalyticsEvent;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
};

export default function AcquisitionCta({ href, event, children, className, ariaLabel }: Props) {
  const handleClick = () => {
    trackElitzeEvent(event, {
      page: typeof window === "undefined" ? "unknown" : window.location.pathname,
      destination: href,
    });
  };

  if (href.startsWith("mailto:")) {
    return (
      <a href={href} onClick={handleClick} className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }

  return (
    <Link href={href} onClick={handleClick} className={className} aria-label={ariaLabel}>
      {children}
    </Link>
  );
}
