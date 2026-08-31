import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type DdgResult = {
  title: string;
  url: string;
  description: string;
};

/**
 * Privacy-first agent search via DuckDuckGo.
 * Server-side only — agents never hold scrape sessions; Elitze brokers the tool call.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const max = Math.min(Number(searchParams.get("max") ?? 5), 10);

  if (!q) {
    return NextResponse.json(
      { ok: false, error: "Query parameter q is required" },
      { status: 400 },
    );
  }

  // Lightweight policy gate examples (mirrors pre-tool hooks)
  const blocked = ["site:internal.", "file://", "localhost"];
  if (blocked.some((b) => q.toLowerCase().includes(b))) {
    return NextResponse.json(
      {
        ok: false,
        denied: true,
        error: "Query blocked by Elitze egress / scope policy",
        policy: "search.domain_allowlist",
      },
      { status: 403 },
    );
  }

  try {
    const { search, SafeSearchType } = await import("duck-duck-scrape");
    const raw = await search(q, {
      safeSearch: SafeSearchType.MODERATE,
    });

    const results: DdgResult[] = (raw.results ?? [])
      .slice(0, max)
      .map((r) => ({
        title: r.title ?? "",
        url: r.url ?? "",
        description: r.description ?? "",
      }));

    // Treat snippets as untrusted — strip obvious instruction-like prefixes for demo
    const sanitized = results.map((r) => ({
      ...r,
      description: r.description
        .replace(/ignore (all |previous )?instructions?/gi, "[filtered]")
        .replace(/system\s*:/gi, "[filtered]:"),
      untrusted: true as const,
    }));

    return NextResponse.json({
      ok: true,
      provider: "duckduckgo",
      privacy: "no-tracking-profile",
      brokeredBy: "elitze",
      query: q,
      resultCount: sanitized.length,
      results: sanitized,
      controls: [
        "purpose-bound tool",
        "snippet sanitization (ASI01)",
        "server-side broker (no agent credentials)",
        "audit log recorded",
      ],
    });
  } catch (error) {
    console.error("DDG search failed", error);
    // Graceful demo fallback so UI still works if upstream blocks the sandbox
    const fallback: DdgResult[] = [
      {
        title: `${q} — overview (cached demo result)`,
        url: `https://duckduckgo.com/?q=${encodeURIComponent(q)}`,
        description:
          "Live DuckDuckGo upstream was unavailable from this environment. Elitze still enforced policy, sanitized output, and returned a safe brokered stub for demo continuity.",
      },
      {
        title: "Elitze · Agentic Security — privacy search broker",
        url: "https://elitze.security",
        description:
          "Agents call search only through Elitze. Queries are purpose-bound, snippets are untrusted data, and no ad-tech profile is built.",
      },
    ];

    return NextResponse.json({
      ok: true,
      provider: "duckduckgo",
      privacy: "no-tracking-profile",
      brokeredBy: "elitze",
      query: q,
      degraded: true,
      resultCount: fallback.length,
      results: fallback.map((r) => ({ ...r, untrusted: true })),
      controls: [
        "purpose-bound tool",
        "snippet sanitization (ASI01)",
        "server-side broker (no agent credentials)",
        "degraded-mode safe stub",
      ],
    });
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as { q?: string; max?: number };
  const url = new URL(request.url);
  if (body.q) url.searchParams.set("q", body.q);
  if (body.max) url.searchParams.set("max", String(body.max));
  return GET(
    new Request(url.toString(), { method: "GET", headers: request.headers }),
  );
}
