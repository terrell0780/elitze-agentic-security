import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import SecurityWorkbenchSidebar from "@/components/security-workbench-sidebar";
export const dynamic = "force-dynamic";
export default async function ConsoleLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login");
  return <div className="min-h-screen lg:pl-64"><SecurityWorkbenchSidebar role={user.role} />{children}</div>;
}
