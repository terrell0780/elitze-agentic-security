import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Elitze · Agentic Security",
  description:
    "Elitze · Agentic Security platform. Security Graph, Intelligence, Policy Engine, Guardrails, Sandbox & Killswitch. Protect APIs, LLMs and agents across CI/CD and runtime.",
  icons: {
    icon: "/images/elitze-mark.png",
    apple: "/images/elitze-mark.png",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.className} bg-[#07040a] text-slate-200 antialiased selection:bg-red-500/30 selection:text-red-100`}
      >
        {children}
      </body>
    </html>
  );
}
