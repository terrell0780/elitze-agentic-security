import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { normalizeTenantRole } from "@/lib/elitze-secure/tenant-security";
import OrganizationMembersConsole from "@/components/organization-members-console";

export const dynamic = "force-dynamic";

export default async function OrganizationAdministrationPage() {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login?next=%2Fconsole%2Forganization");
  const role = normalizeTenantRole(user.role);
  if (role !== "OWNER" && role !== "SECURITY_ADMIN") redirect("/console");
  return <OrganizationMembersConsole actorRole={role} />;
}
