import type { Metadata } from "next";
import AcceptInvitationForm from "@/components/accept-invitation-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Accept Organization Invitation | ELITZE",
  robots: { index: false, follow: false },
};

export default async function AcceptInvitationPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : "";
  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <AcceptInvitationForm token={token} />
    </main>
  );
}
