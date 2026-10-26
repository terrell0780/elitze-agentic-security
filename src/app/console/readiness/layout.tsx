import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { isPlatformOwner } from "@/lib/platform-owner";

export const dynamic = "force-dynamic";

export default async function PlatformReadinessLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login?next=%2Fconsole%2Freadiness");
  if (!isPlatformOwner(user)) redirect("/console");
  return children;
}
