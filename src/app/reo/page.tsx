import Link from "next/link";

export const metadata = {
  title: "ELITZE REO | Search & Content Intelligence",
  description: "ELITZE REO unifies content integrity, search analytics, technical SEO, evidence and publishing governance.",
};

const controls = [
  ["Provenance", "Required before automatic approval"],
  ["Evidence", "Verified evidence required for approval"],
  ["Uniqueness", "Composite semantic, lexical and structural signals"],
  ["Risk", "Scale, duplication, thinness, factuality, staleness, policy and reputation"],
  ["Publishing Governor", "Approve, review, queue or block"],
  ["Audit", "Decision-ready event trail with content references"],
];

const seoSignals = [
  ["Technical Analytics", "Crawlability, indexation, robots controls, canonicalization, mobile experience and Core Web Vitals."],
  ["On-Page Analytics", "Titles, descriptions, headings, content structure, internal links, entities and structured data."],
  ["Off-Page Analytics", "Backlinks, referring domains, anchor patterns and authority signals when source data is connected."],
  ["Performance Analytics", "Clicks, impressions, CTR, average position, traffic and conversion signals from connected sources."],
  ["Search Intelligence", "Query, page, country, device and search-type analysis from available search-performance data."],
  ["AI Discovery", "Search visibility and citation-oriented signals across traditional and AI-assisted discovery surfaces."],
];

const connectors = [
  ["Google Search Console", "Search Analytics API can provide clicks, impressions, CTR and average position when tenant authorization is configured."],
  ["Google Analytics", "Can be correlated with Search Console while preserving the different measurement models and URL scopes."],
  ["Bing Webmaster Tools", "Search performance, SEO/GEO reports, backlinks and keyword research are available when tenant access is configured."],
];

export default function ReoPage() {
  return (
    <main className="min-h-screen bg-[#07070a] px-4 py-10 text-zinc-100 sm:px-6 sm:py-14">
      <section className="mx-auto max-w-6xl space-y-10">
        <header className="max-w-4xl space-y-4">
          <p className="text-sm uppercase tracking-[0.24em] text-zinc-500">ELITZE REO</p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Search &amp; Content Intelligence</h1>
          <p className="text-base leading-7 text-zinc-400 sm:text-lg sm:leading-8">Content integrity and SEO web analytics in one governed control plane: understand how people discover content, validate what the content claims, measure performance, and control publication without presenting unavailable data as fact.</p>
        </header>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">SEO Web Analytics</p>
              <h2 className="mt-1 text-xl font-medium">Discovery → evidence → performance → governance</h2>
            </div>
            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-xs text-amber-200">Live-source data required</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {seoSignals.map(([title, description]) => (
              <article key={title} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <h3 className="font-medium">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {controls.map(([title, description]) => (
            <article key={title} className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
              <h2 className="font-medium">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
            </article>
          ))}
        </div>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-5 sm:p-6">
          <h2 className="font-medium">Search data connectors</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-500">No connector is represented as connected unless the tenant has actually authorized it.</p>
          <div className="mt-4 grid gap-3 lg:grid-cols-3">
            {connectors.map(([title, description]) => (
              <article key={title} className="rounded-xl border border-zinc-800 bg-black/30 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium">{title}</h3>
                  <span className="text-[10px] uppercase tracking-widest text-zinc-600">Not connected</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-zinc-500">{description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-6">
          <h2 className="font-medium">Decision contract</h2>
          <div className="mt-4 grid gap-3 text-sm text-zinc-400 sm:grid-cols-2 lg:grid-cols-4">
            <span>APPROVE → publish</span>
            <span>REVIEW → human review</span>
            <span>QUEUE → staged release</span>
            <span>BLOCK → policy failure</span>
          </div>
        </section>

        <Link href="/platform" className="inline-block text-sm underline underline-offset-4">Back to ELITZE Platform</Link>
      </section>
    </main>
  );
}
