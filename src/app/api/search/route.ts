import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 500;
const MAX_RESULTS = 10;

type DdgResult = {
  title: string;
  url: string;
  description: string;
  untrusted: true;
};

function validateQuery(q: string, max: number) {
  if (!q) return "Query parameter q is required";
  if (q.length > MAX_QUERY_LENGTH) return "Query parameter q is too long";
  if (!Number.isInteger(max) || max < 1 || max > MAX_RESULTS) return "max must be an integer from 1 to 10";
  if (["site:internal.", "file://", "localhost", "127.0.0.1", "0.0.0.0"].some((blocked) => q.toLowerCase().includes(blocked))) {
    return "Query blocked by ELITZE scope policy";
  }
  return null;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get("q") ?? "").trim();
  const requestedMax = Number(searchParams.get("max") ?? 5);
  const max = Number.isFinite(requestedMax) ? Math.trunc(requestedMax) : 0;
  const error = validateQuery(q, max);

  if (error) {
    return NextResponse.json(
      { ok: false, denied: error.includes("scope policy"), error },
      { status: error.includes("scope policy") ? 403 : 400 },
    );
  }

  try {
    const { search, SafeSearchType } = await import("duck-duck-scrape");
    const raw = await search(q, { safeSearch: SafeSearchType.MODERATE });
    const results: DdgResult[] = (raw.results ?? []).slice(0, max).map((r) => ({
      title: String(r.title ?? "").slice(0, 500),
      url: String(r.url ?? "").slice(0, 2000),
      description: String(r.description ?? "")
        .slice(0, 2000)
        .replace(/ignore (all |previous )?instructions?/gi, "[filtered]")
        .replace(/system\s*:/gi, "[filtered]:"),
      untrusted: true,
    }));

    return NextResponse.json(
      { ok: true, provider: "duckduckgo", privacy: "server-brokered", query: q, resultCount: results.length, results },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    console.error("ELITZE search upstream failed", error);
    return NextResponse.json(
      { ok: false, error: "search_upstream_unavailable" },
      { status: 502, headers: { "cache-control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const { q, max } = body as { q?: unknown; max?: unknown };
  if (typeof q !== "string" || (max !== undefined && typeof max !== "number")) {
    return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  }
  const url = new URL(request.url);
  url.searchParams.set("q", q);
  if (max !== undefined) url.searchParams.set("max", String(max));
  return GET(new Request(url, { method: "GET" }));
}
