"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { RefreshCw, Send, ShieldCheck, UserPlus, Users, XCircle } from "lucide-react";

type Member = {
  id: string;
  email: string;
  displayName: string | null;
  role: string;
  status: string;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
};
type Invitation = {
  id: string;
  email: string;
  role: string;
  expiresAt: string;
  createdAt: string;
  invitedBy: string;
};
type Payload = { ok: boolean; error?: string; members?: Member[]; invitations?: Invitation[] };

const roleLabel = (role: string) => ({
  owner: "Owner",
  admin: "Security admin",
  member: "Analyst / member",
  approver: "Approver",
  viewer: "Read-only viewer",
}[role.toLowerCase()] ?? role);

const dateLabel = (value: string | null | undefined) => {
  if (!value) return "Never";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unavailable" : date.toLocaleString();
};

export default function OrganizationMembersConsole({ actorRole }: { actorRole: "OWNER" | "SECURITY_ADMIN" }) {
  const [members, setMembers] = useState<Member[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"member" | "approver" | "viewer" | "admin">("member");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/console/members", { cache: "no-store" });
      const payload = await response.json() as Payload;
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "organization_members_unavailable");
      setMembers(payload.members ?? []);
      setInvitations(payload.invitations ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "organization_members_unavailable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function invite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/console/members", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim(), role }),
      });
      const payload = await response.json() as { ok: boolean; error?: string; status?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "organization_invitation_failed");
      setEmail("");
      setRole("member");
      setNotice("Invitation email sent. The invitation expires in seven days.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "organization_invitation_failed");
    } finally {
      setBusy(false);
    }
  }

  async function revoke(invitationId: string) {
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/console/members", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ invitationId }),
      });
      const payload = await response.json() as { ok: boolean; error?: string };
      if (!response.ok || !payload.ok) throw new Error(payload.error ?? "invitation_revoke_failed");
      setNotice("Invitation revoked.");
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "invitation_revoke_failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main-content" tabIndex={-1} className="min-h-screen bg-[#070b10] px-4 py-8 text-slate-100 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[.24em] text-cyan-300">Organization administration</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Organization & members</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">Manage tenant access and invite business teammates. Invitations expire after seven days. Account credentials and invite tokens are never displayed on this page.</p>
          </div>
          <button type="button" onClick={() => void load()} disabled={loading || busy} className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2.5 text-sm font-semibold hover:border-cyan-300/30 disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>

        {error && <div role="alert" className="mt-6 rounded-xl border border-rose-300/25 bg-rose-300/[.06] p-4 text-sm text-rose-100">Request failed: {error}</div>}
        {notice && <div role="status" className="mt-6 rounded-xl border border-cyan-300/20 bg-cyan-300/[.05] p-4 text-sm text-cyan-100">{notice}</div>}

        <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
            <div className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-cyan-200" /><h2 className="text-lg font-semibold">Invite a teammate</h2></div>
            <form onSubmit={invite} className="mt-5 space-y-4">
              <div>
                <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-slate-300">Work email address</label>
                <input id="invite-email" name="email" type="email" autoComplete="email" required maxLength={320} value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-white/10 bg-black/20 px-3 py-3 text-sm outline-none focus:border-cyan-300/50" placeholder="colleague@company.com" />
              </div>
              <div>
                <label htmlFor="invite-role" className="mb-2 block text-sm font-medium text-slate-300">Role</label>
                <select id="invite-role" name="role" value={role} onChange={(event) => setRole(event.target.value as typeof role)} className="w-full rounded-xl border border-white/10 bg-[#0b1017] px-3 py-3 text-sm outline-none focus:border-cyan-300/50">
                  <option value="member">Analyst / member — analyze and work with security data</option>
                  <option value="approver">Approver — review governed actions</option>
                  <option value="viewer">Read-only viewer</option>
                  {actorRole === "OWNER" && <option value="admin">Security admin — manage security and integrations</option>}
                </select>
              </div>
              <div className="rounded-xl border border-white/8 bg-black/15 p-3 text-xs leading-5 text-slate-400">
                <ShieldCheck className="mr-1 inline h-4 w-4 text-cyan-300" />
                Invitations are tenant-scoped. An email already linked to another ELITZE account must use that account's existing organization until multi-organization membership is supported.
              </div>
              <button type="submit" disabled={busy || !email.trim()} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-50">
                <Send className="h-4 w-4" /> {busy ? "Working…" : "Send invitation"}
              </button>
              <p className="text-[11px] leading-5 text-slate-500">Only the organization owner can grant security-admin access. Admins can invite analysts, approvers, and viewers.</p>
            </form>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
            <div className="flex items-center gap-2"><Users className="h-5 w-5 text-cyan-200" /><h2 className="text-lg font-semibold">Organization members</h2><span className="ml-auto rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400">{members.length}</span></div>
            {loading ? <p className="mt-5 text-sm text-slate-500">Loading tenant records…</p> : members.length === 0 ? <p className="mt-5 text-sm text-slate-500">No member records were returned.</p> : (
              <div className="mt-5 divide-y divide-white/[.07]">
                {members.map((member) => (
                  <article key={member.id} className="flex flex-wrap items-start justify-between gap-3 py-4 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <h3 className="break-words text-sm font-semibold">{member.displayName || member.email}</h3>
                      {member.displayName && <p className="mt-1 break-words text-xs text-slate-400">{member.email}</p>}
                      <p className="mt-2 text-xs text-slate-500">Last login: {dateLabel(member.lastLoginAt)}</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-flex rounded-full border border-cyan-300/15 px-2 py-1 text-[10px] font-semibold text-cyan-100">{roleLabel(member.role)}</span>
                      <p className="mt-2 text-[10px] uppercase tracking-wider text-slate-500">{member.status}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 rounded-2xl border border-white/10 bg-white/[.025] p-5 sm:p-6">
          <div className="flex items-center gap-2"><Send className="h-5 w-5 text-cyan-200" /><h2 className="text-lg font-semibold">Pending invitations</h2><span className="ml-auto rounded-full border border-white/10 px-2 py-1 text-xs text-slate-400">{invitations.length}</span></div>
          {loading ? <p className="mt-5 text-sm text-slate-500">Loading invitation records…</p> : invitations.length === 0 ? <p className="mt-5 text-sm text-slate-500">No pending invitations.</p> : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] border-collapse text-left text-sm">
                <thead><tr className="border-b border-white/10 text-xs text-slate-500"><th scope="col" className="py-3 pr-4 font-medium">Email</th><th scope="col" className="py-3 pr-4 font-medium">Role</th><th scope="col" className="py-3 pr-4 font-medium">Expires</th><th scope="col" className="py-3 text-right font-medium">Action</th></tr></thead>
                <tbody>
                  {invitations.map((invitation) => <tr key={invitation.id} className="border-b border-white/[.06] last:border-0">
                    <td className="break-all py-3 pr-4">{invitation.email}</td>
                    <td className="py-3 pr-4 text-slate-400">{roleLabel(invitation.role)}</td>
                    <td className="py-3 pr-4 text-slate-400">{dateLabel(invitation.expiresAt)}</td>
                    <td className="py-3 text-right"><button type="button" disabled={busy} onClick={() => void revoke(invitation.id)} className="inline-flex items-center gap-1 rounded-lg border border-white/10 px-3 py-2 text-xs font-semibold hover:border-rose-300/30 hover:text-rose-100 disabled:opacity-50"><XCircle className="h-3.5 w-3.5" /> Revoke</button></td>
                  </tr>)}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
