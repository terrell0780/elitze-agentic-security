import Link from "next/link";

export default function SiteFooter() {
  return (
    <footer className="border-t border-[var(--border)]">
    <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-4 px-4 py-7 text-xs text-[var(--muted)] sm:px-7">
    <span>ELITZE Agentic Security · Agent identity and MCP runtime security</span>
    <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Footer navigation">
    <Link href="/security" className="hover:text-[var(--text)]">Security</Link>
    <Link href="/about" className="hover:text-[var(--text)]">About</Link>
    <Link href="/how-to" className="hover:text-[var(--text)]">How-to</Link>
    <Link href="/faq" className="hover:text-[var(--text)]">FAQ</Link>
    <Link href="/docs" className="hover:text-[var(--text)]">Docs</Link>
    <Link href="/chat" className="hover:text-[var(--text)]">Chat</Link>
    <Link href="/privacy" className="hover:text-[var(--text)]">Privacy</Link>
    <Link href="/terms" className="hover:text-[var(--text)]">Terms</Link>
    <Link href="/contact" className="hover:text-[var(--text)]">Contact</Link>
    </nav>
    </div>
    </footer>
  );
}
