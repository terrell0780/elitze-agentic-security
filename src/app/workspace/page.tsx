import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false, googleBot: { index: false, follow: false } } };

export default async function WorkspaceEntryPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login?next=%2Fworkspace");
  redirect("/console");
}
