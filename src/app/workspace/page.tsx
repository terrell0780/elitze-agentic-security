import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function WorkspaceEntryPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login?next=%2Fworkspace");
  redirect("/console");
}
