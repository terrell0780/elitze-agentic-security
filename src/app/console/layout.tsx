import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SecurityWorkbenchSidebar from "@/components/security-workbench-sidebar";
export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };
export default async function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  return <div className="min-h-screen lg:pl-64"><SecurityWorkbenchSidebar />{children}</div>;
}
