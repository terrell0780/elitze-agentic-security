import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

const topics = {
  "agent-identity-security": {
    title: "Agent Identity Security",
    description: "How to establish accountable identities for autonomous agents, workloads, delegation and runtime actions.",
    sections: [
      ["The security problem", "Autonomous agents need identities that can be scoped, delegated, revoked and tied to the action being attempted. A model name alone does not establish who is acting or what authority was delegated."],
      ["ELITZE control path", "Discover the agent, identify its workload identity and owner, map delegated authority, evaluate the requested action, preserve the decision and retest the path after remediation."],
      ["What to verify", "Identity source, tenant scope, owner, delegation chain, capability scope, credential reference, expiration, revocation state and evidence of the resulting decision."],
    ],
  },
  "mcp-runtime-security": {
    title: "MCP Runtime Security",
    description: "Runtime security for MCP servers, sessions, tools and agent-to-tool execution paths.",
    sections: [
      ["The security problem", "MCP creates a practical connection between agents and callable tools. Security therefore needs visibility into servers, tools, identity, requested actions and the authorization boundary."],
      ["ELITZE control path", "Discover MCP surfaces, bind workload identity, map tool reach, evaluate policy before execution and preserve evidence of the decision."],
      ["What to verify", "MCP server identity, tool inventory, schema changes, session identity, requested capability, resource classification, policy result and evidence freshness."],
    ],
  },
  "agent-reachability": {
    title: "Agent Reachability",
    description: "Map what an autonomous agent can reach across tools, APIs, credentials and data resources.",
    sections: [
      ["The security problem", "Knowing that an agent exists is not enough. The useful security question is what the identity can actually reach and which relationships create an execution path."],
      ["ELITZE control path", "Record observed graph relationships and distinguish observed, inferred, unknown and unmeasurable reachability rather than filling gaps with assumptions."],
      ["What to verify", "Identity-to-tool, tool-to-resource, API, credential and data relationships, plus the provenance and freshness of each relationship."],
    ],
  },
  "ai-tool-authorization": {
    title: "AI Tool Authorization",
    description: "Policy-before-execution controls for AI agents calling sensitive tools and APIs.",
    sections: [
      ["The security problem", "Agent actions can become real changes to data, systems or external services. Authorization must evaluate the request in context before the sensitive action executes."],
      ["ELITZE control path", "Evaluate identity, delegation, tool, action, resource, environment, data classification, purpose and approval state against deterministic policy."],
      ["Decision states", "ELITZE ALLOWED, ELITZE DENIED, ELITZE HELD FOR REVIEW, ELITZE REVOKED and ELITZE VERIFIED describe the accountable outcome without hiding missing evidence."],
    ],
  },
  "agentic-security-evidence": {
    title: "Agentic Security Evidence",
    description: "Evidence-bound records for agent identity, policy decisions, runtime actions and verification.",
    sections: [
      ["The security problem", "Security teams need more than an alert. They need a traceable record showing what requested the action, which policy applied, what decision was made and what was verified afterward."],
      ["ELITZE evidence model", "Preserve request context, identity chain, policy reference, decision, provenance, timestamps, hashes and verification state. Tamper evidence protects record integrity; it does not turn inference into observation."],
      ["No record, no claim", "Missing source evidence remains UNKNOWN, UNMEASURABLE or UNAVAILABLE instead of being converted into a fabricated operational state."],
    ],
  },
  "autonomous-agent-governance": {
    title: "Autonomous Agent Governance",
    description: "Govern autonomous agents with identity, authority, runtime policy, evidence and retesting.",
    sections: [
      ["The security problem", "Governance must follow the agent into execution. Ownership, delegation and policy need to remain visible while the agent is using tools and resources."],
      ["ELITZE model", "Discover → Identify → Map Reach → Decide → Execute → Prove → Retest."],
      ["Enterprise outcome", "The goal is a consistent, auditable control path for autonomous actions without pretending that unconfigured integrations or missing telemetry are live."],
    ],
  },
  "prompt-injection-runtime-controls": {
    title: "Prompt Injection Runtime Controls",
    description: "Runtime controls that treat prompt injection as an authorization and execution problem, not only a content-filtering problem.",
    sections: [
      ["The security problem", "A malicious instruction can redirect an agent toward a tool or resource outside its approved purpose. The control boundary therefore has to survive the model's decision-making process."],
      ["ELITZE control path", "Observe the identity and requested tool action, compare the request with delegated capability and policy, then hold or deny before sensitive execution."],
      ["Verification", "The security result becomes stronger when the blocked path can be retested and the resulting decision is preserved as evidence."],
    ],
  },
  "non-human-identity-security": {
    title: "Non-Human Identity Security for Agents",
    description: "Security controls for machine identities, agent workloads, delegation and capability scope.",
    sections: [
      ["The security problem", "Agents and workloads create non-human principals with real access. Traditional human identity controls alone do not explain the runtime authority chain."],
      ["ELITZE model", "Bind the workload to a tenant-scoped identity, preserve human ownership and delegation context, scope capabilities and record every sensitive decision."],
      ["Revocation", "Authority can become stale or unsafe. A mature control plane therefore treats expiration and revocation as first-class security states."],
    ],
  },
  "ai-security-control-plane": {
    title: "AI Security Control Plane",
    description: "An identity, decision and evidence plane for autonomous agent security.",
    sections: [
      ["Control-plane model", "ELITZE coordinates discovery, identity, reachability, policy, runtime enforcement, evidence and retesting around a single security path."],
      ["What makes it operational", "The useful boundary is the point where a real agent action can be evaluated before a sensitive tool execution and the decision can be proven afterward."],
      ["Product principle", "The model is not the security boundary. The actionable boundary is identity + authorization + execution control + evidence."],
    ],
  },
  "agent-security-graph": {
    title: "Agent Security Graph",
    description: "Map agents, identities, tools, APIs, resources, policies and evidence as security relationships.",
    sections: [
      ["Graph purpose", "The graph makes the path between an agent identity and a sensitive resource inspectable instead of hiding it inside disconnected records."],
      ["Core relationships", "Delegates, authorizes, invokes, routes to, can reach, reads, writes, executes, governs, decides, results in, supports and verifies."],
      ["Evidence state", "Each important relationship should retain provenance and an evidence state such as OBSERVED, INFERRED, UNKNOWN or UNMEASURABLE."],
    ],
  },
} as const;

type TopicSlug = keyof typeof topics;

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams(): Array<{ slug: TopicSlug }> {
  return Object.keys(topics).map((slug) => ({ slug: slug as TopicSlug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const topic = topics[slug as TopicSlug];
  if (!topic) return {};
  return {
    title: `${topic.title} | ELITZE Agentic Security`,
    description: topic.description,
    alternates: { canonical: `https://elitze.ca/security/topics/${slug}` },
  };
}

export default async function SecurityTopicPage({ params }: Props) {
  const { slug } = await params;
  const topic = topics[slug as TopicSlug];
  if (!topic) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: topic.title,
    description: topic.description,
    mainEntityOfPage: `https://elitze.ca/security/topics/${slug}`,
    publisher: { "@type": "Organization", name: "ELITZE", url: "https://elitze.ca" },
  };

  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
        <nav className="text-[10px] font-bold uppercase tracking-[.2em] text-[var(--muted)]" aria-label="Breadcrumb">
          <Link href="/security" className="hover:text-[var(--accent)]">Security</Link> <span className="mx-2">/</span> <span>{topic.title}</span>
        </nav>
        <header className="mt-8 max-w-4xl">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE SECURITY TOPIC</div>
          <h1 className="mt-3 text-4xl font-black tracking-[-.045em] sm:text-6xl">{topic.title}</h1>
          <p className="mt-5 max-w-3xl text-lg leading-8 text-[var(--muted-strong)]">{topic.description}</p>
        </header>

        <div className="mt-10 grid gap-4">
          {topic.sections.map(([heading, body]) => (
            <article key={heading} className="rounded-3xl border border-[var(--border)] bg-[var(--panel)] p-6 sm:p-8">
              <h2 className="text-xl font-bold">{heading}</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted-strong)]">{body}</p>
            </article>
          ))}
        </div>

        <section className="mt-10 rounded-3xl border border-[var(--accent-border)] bg-[var(--accent-soft)] p-6 sm:p-8">
          <div className="text-[10px] font-bold uppercase tracking-[.22em] text-[var(--accent)]">ELITZE control path</div>
          <div className="mt-4 text-base font-bold">Discover → Identify → Map Reach → Decide → Execute → Prove → Retest</div>
          <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-[var(--muted)]">
            <Link href="/control-room" className="rounded-full border border-[var(--accent-border)] px-3 py-1.5 hover:text-[var(--text)]">Attack the Agent</Link>
            <Link href="/console/pentesting" className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:text-[var(--text)]">Pentesting</Link>
            <Link href="/security" className="rounded-full border border-[var(--border)] px-3 py-1.5 hover:text-[var(--text)]">Security model</Link>
          </div>
        </section>
      </div>
    </main>
  );
}
