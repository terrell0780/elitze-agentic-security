import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
export const dynamic = "force-dynamic";
export default async function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  return children;
}
