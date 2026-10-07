import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const EPSS_URL = "https://api.first.org/data/v1/epss";

const modeSet = new Set(["cve", "kev", "zero-day", "package"]);

const fetchJson = async (url: string, headers: Record<string, string> = {}) => {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "ELITZE-Agentic-Security/1.0", ...headers },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new Error("upstream_http_" + response.status);
  return response.json() as Promise<any>;
};

function nvdUrl(query: string) {
  const url = new URL(NVD_URL);
  url.searchParams.set("resultsPerPage", "20");
  url.searchParams.set("keywordSearch", query);
  return url.toString();
}

function normalizeNvd(item: any) {
  const cve = item?.cve ?? {};
  const id = String(cve.id ?? "");
  const description = String(
    cve.descriptions?.find((entry: any) => entry?.lang === "en")?.value ??
    cve.descriptions?.[0]?.value ??
    "No description supplied by NVD.",
  );
  const metrics = cve.metrics ?? {};
  const metric = metrics.cvssMetricV31?.[0] ?? metrics.cvssMetricV30?.[0] ?? metrics.cvssMetricV2?.[0] ?? null;
  const baseScore = metric?.cvssData?.baseScore ?? null;
  const references = Array.isArray(cve.references)
    ? cve.references.slice(0, 8).map((entry: any) => String(entry?.url ?? "")).filter(Boolean)
    : [];
  return {
    id,
    source: "NVD",
    title: id || "NVD vulnerability",
    url: id ? "https://nvd.nist.gov/vuln/detail/" + encodeURIComponent(id) : "https://nvd.nist.gov/",
    description,
    cvss: typeof baseScore === "number" ? baseScore : null,
    epss: null,
    kev: false,
    published: cve.published ?? null,
    modified: cve.lastModified ?? null,
    references,
    external: true,
  };
}

function normalizeKev(item: any) {
  const id = String(item?.cveID ?? "");
  return {
    id,
    source: "CISA KEV",
    title: item?.vulnerabilityName ? String(item.vulnerabilityName) : id || "Known exploited vulnerability",
    url: item?.notes ? String(item.notes).split(" ")[0] : (id ? "https://nvd.nist.gov/vuln/detail/" + encodeURIComponent(id) : KEV_URL),
    description: String(item?.shortDescription ?? "Known exploited vulnerability listed by CISA."),
    cvss: null,
    epss: null,
    kev: true,
    published: item?.dateAdded ?? null,
    modified: null,
    references: [],
    vendor: item?.vendorProject ?? null,
    product: item?.product ?? null,
    requiredAction: item?.requiredAction ?? null,
    dueDate: item?.dueDate ?? null,
    external: true,
  };
}

async function cisaKev(query: string) {
  const feed = await fetchJson(KEV_URL);
  const rows = Array.isArray(feed?.vulnerabilities) ? feed.vulnerabilities : [];
  const q = query.toLowerCase();
  return rows
    .filter((row: any) => {
      if (!q) return true;
      return [
        row.cveID,
        row.vendorProject,
        row.product,
        row.vulnerabilityName,
        row.shortDescription,
      ].filter(Boolean).join(" ").toLowerCase().includes(q);
    })
    .sort((a: any, b: any) => String(b.dateAdded ?? "").localeCompare(String(a.dateAdded ?? "")))
    .slice(0, 20)
    .map(normalizeKev);
}

async function nvd(query: string) {
  const headers: Record<string, string> = {};
  const key = process.env.NVD_API_KEY?.trim();
  if (key) headers.apiKey = key;
  const payload = await fetchJson(nvdUrl(query), headers);
  return (Array.isArray(payload?.vulnerabilities) ? payload.vulnerabilities : []).map(normalizeNvd);
}

async function enrichEpss(results: any[]) {
  const ids = results.map((item) => item.id).filter((id) => /^CVE-\d{4}-\d+$/i.test(id)).slice(0, 30);
  if (!ids.length) return results;
  try {
    const url = new URL(EPSS_URL);
    url.searchParams.set("cve", ids.join(","));
    const payload = await fetchJson(url.toString());
    const scores = new Map<string, any>((payload?.data ?? []).map((row: any) => [String(row.cve).toUpperCase(), row]));
    return results.map((item) => {
      const row = scores.get(String(item.id).toUpperCase());
      return row ? { ...item, epss: Number(row.epss), epssPercentile: Number(row.percentile) } : item;
    });
  } catch {
    return results;
  }
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = (params.get("mode") ?? "cve").trim().toLowerCase();
  const query = (params.get("q") ?? "").trim().slice(0, 240);
  if (!modeSet.has(mode)) return NextResponse.json({ ok: false, error: "invalid_mode" }, { status: 400 });
  if (!query) return NextResponse.json({ ok: false, error: "query_required" }, { status: 400 });

  try {
    let results: any[] = [];
    const sourceStates: Record<string, string> = {};

    if (mode === "kev") {
      try { results = await cisaKev(query); sourceStates.cisaKev = "LIVE"; }
      catch { sourceStates.cisaKev = "UNAVAILABLE"; }
    } else if (mode === "cve" || mode === "package") {
      try { results = await nvd(query); sourceStates.nvd = "LIVE"; }
      catch { sourceStates.nvd = "UNAVAILABLE"; }
      results = await enrichEpss(results);
    } else {
      const [kevResults, nvdResults] = await Promise.allSettled([cisaKev(query), nvd(query)]);
      if (kevResults.status === "fulfilled") { results.push(...kevResults.value); sourceStates.cisaKev = "LIVE"; }
      else sourceStates.cisaKev = "UNAVAILABLE";
      if (nvdResults.status === "fulfilled") { results.push(...nvdResults.value); sourceStates.nvd = "LIVE"; }
      else sourceStates.nvd = "UNAVAILABLE";
      results = await enrichEpss(results);
    }

    const deduped = [...new Map(results.map((item) => [item.source + ":" + item.id + ":" + item.title, item])).values()]
      .slice(0, 30);

    return NextResponse.json({
      ok: true,
      query,
      mode,
      observedAt: new Date().toISOString(),
      sourceStates,
      resultCount: deduped.length,
      results: deduped,
      truthNote: "Live external intelligence is discovery evidence only. It does not prove customer exposure, exploitability, or compromise.",
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE vulnerability intelligence failed", error);
    return NextResponse.json({ ok: false, error: "vulnerability_intelligence_unavailable" }, { status: 503 });
  }
}
