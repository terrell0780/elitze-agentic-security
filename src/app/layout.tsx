import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "ELITZE · Agentic Security",
  description: "ELITZE · Agentic Security — security control for identities, agents, tools, data and runtime containment.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-[#07040a] text-slate-100 antialiased selection:bg-red-500/30 selection:text-red-100">
        {children}
      </body>
    </html>
  );
}
