import { NextRequest, NextResponse } from "next/server";
import { calculateElitzeVpr, type VprContext } from "@/lib/vulnerability-triage";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";
const EPSS_URL = "https://api.first.org/data/v1/epss";
const OSV_QUERY_URL = "https://api.osv.dev/v1/query";
const OSV_VULN_URL = "https://api.osv.dev/v1/vulns/";
const GH_ADVISORY_URL = "https://api.github.com/advisories";

const modeSet = new Set(["cve", "kev", "zero-day", "package", "osv", "advisory", "ghsa"]);

const fetchJson = async (
  url: string,
  headers: Record<string, string> = {},
  init: { method?: string; body?: string } = {},
) => {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "ELITZE-Agentic-Security/1.0", ...headers },
    cache: "no-store",
    signal: AbortSignal.timeout(12_000),
    ...init,
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


type OsvInput = { package?: { name: string; ecosystem?: string }; vuln_id?: string };

function normalizeOsvVuln(item: any) {
  const id = String(item?.id ?? "");
  const aliases = Array.isArray(item?.aliases) ? item.aliases.map(String) : [];
  const cve = aliases.find((a: string) => /^CVE-/i.test(a)) ?? (id.startsWith("CVE-") ? id : null);
  const severity = (item?.database_specific ?? {}).severity ?? null;
  const vector = (item?.severity ?? []).find((s: any) => String(s?.type ?? "").startsWith("CVSS"))?.score ?? null;
  const fixed: string[] = [];
  for (const affected of item?.affected ?? []) {
    for (const range of affected?.ranges ?? []) {
      for (const event of range?.events ?? []) {
        if (event?.fixed) fixed.push(`${affected?.package?.name ?? "?"}@${event.fixed}`);
      }
    }
  }
  return {
    id: id || "OSV",
    source: "OSV.dev",
    title: String(item?.summary ?? id ?? "OSV advisory").slice(0, 200),
    url: id ? OSV_VULN_URL + encodeURIComponent(id) : "https://api.osv.dev",
    description: String(item?.details ?? item?.summary ?? "Open Source Vulnerability advisory."),
    cvss: null,
    cvss_vector: vector,
    severity_label: severity,
    epss: null,
    kev: false,
    published: item?.published ?? null,
    modified: item?.modified ?? null,
    aliases,
    fixed_versions: fixed.slice(0, 12),
    references: Array.isArray(item?.references)
      ? item.references.slice(0, 8).map((r: any) => String(r?.url ?? r)).filter(Boolean)
      : [],
    external: true,
  };
}

async function osvByPackage(query: string, ecosystem: string | null) {
  const pkg: Record<string, string> = { name: query };
  if (ecosystem) pkg.ecosystem = ecosystem;
  const payload = await fetchJson(OSV_QUERY_URL, {
    "content-type": "application/json",
  }, { method: "POST", body: JSON.stringify({ package: pkg }) });
  const vulns = Array.isArray(payload?.vulns) ? payload.vulns : [];
  return vulns.slice(0, 20).map(normalizeOsvVuln);
}

async function osvById(query: string) {
  if (!/^(CVE-|GHSA-|OSV-|PYSEC-|RUSTSEC-)/i.test(query)) return [];
  const payload = await fetchJson(OSV_VULN_URL + encodeURIComponent(query));
  return [normalizeOsvVuln(payload)].filter((item) => item.id && item.id !== "OSV");
}

function normalizeGhAdvisory(item: any) {
  const ghsa = String(item?.ghsa_id ?? "");
  const cve = String(item?.cve_id ?? "");
  const id = cve || ghsa || "GHSA";
  const cvss = item?.cvss?.score ?? null;
  return {
    id,
    source: "GitHub Advisory",
    title: String(item?.summary ?? id ?? "GitHub advisory").slice(0, 200),
    url: String(item?.html_url ?? (ghsa ? "https://github.com/advisories/" + ghsa : "https://github.com/advisories")),
    description: String(item?.description ?? item?.summary ?? "GitHub Advisory Database entry."),
    cvss: typeof cvss === "number" ? cvss : null,
    epss: null,
    kev: false,
    published: item?.published_at ?? null,
    modified: item?.updated_at ?? null,
    ghsa: ghsa || null,
    severity: item?.severity ?? null,
    ecosystems: Array.isArray(item?.vulnerabilities)
      ? [...new Set(item.vulnerabilities.map((v: any) => String(v?.package?.ecosystem ?? "")).filter(Boolean))]
      : [],
    references: Array.isArray(item?.references) ? item.references.slice(0, 8).map(String) : [],
    external: true,
  };
}

async function githubAdvisories(query: string) {
  const headers: Record<string, string> = {
    accept: "application/vnd.github+json",
    "x-github-api-version": "2022-11-28",
  };
  const token = process.env.GITHUB_TOKEN?.trim() || process.env.GH_TOKEN?.trim();
  if (token) headers.authorization = "Bearer " + token;
  const url = new URL(GH_ADVISORY_URL);
  url.searchParams.set("per_page", "20");
  if (query) url.searchParams.set("keywords", query);
  const payload = await fetchJson(url.toString(), headers);
  const rows = Array.isArray(payload) ? payload : [];
  return rows.map(normalizeGhAdvisory);
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

function parseVprContext(params: URLSearchParams): VprContext | null {
  const assetCriticality = (params.get("asset_criticality") ?? "").toUpperCase();
  const networkExposure = (params.get("network_exposure") ?? "").toUpperCase();
  const dataClassification = (params.get("data_classification") ?? "").toUpperCase();
  const exploitRaw = (params.get("exploit_available") ?? "").toLowerCase();
  if (!["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(assetCriticality)) return null;
  if (!["PUBLIC", "INTERNAL", "ISOLATED"].includes(networkExposure)) return null;
  if (!["PII", "SENSITIVE", "PUBLIC"].includes(dataClassification)) return null;
  if (exploitRaw !== "true" && exploitRaw !== "false") return null;
  return { assetCriticality: assetCriticality as VprContext["assetCriticality"], networkExposure: networkExposure as VprContext["networkExposure"], dataClassification: dataClassification as VprContext["dataClassification"], exploitAvailable: exploitRaw === "true" };
}

function attachTriageEvidence(item: any, observedAt: string, vprContext: VprContext | null) {
  const cvss = typeof item.cvss === "number" && Number.isFinite(item.cvss) ? item.cvss : null;
  const epss = typeof item.epss === "number" && Number.isFinite(item.epss) ? item.epss : null;
  // This transparent triage signal is not a proprietary VPR score and is not a finding of exploitability.
  const prioritySignal = cvss !== null && epss !== null
    ? Math.round(Math.min(100, Math.max(0, cvss * 7 + epss * 30 + (item.kev === true ? 15 : 0))))
    : null;
  const vprScore = cvss !== null && vprContext ? calculateElitzeVpr(cvss, vprContext) : null;
  const sourceUrl = item.source === "CISA KEV" ? KEV_URL : String(item.url ?? NVD_URL);
  return {
    ...item,
    truth_state: "OBSERVED",
    evidence_reference: {
      source: String(item.source ?? "UNKNOWN"),
      source_url: sourceUrl,
      record_url: String(item.url ?? sourceUrl),
      observed_at: observedAt,
      external_record_only: true,
    },
    reachability: {
      truth_state: "UNMEASURABLE",
      reason: "Customer asset inventory, deployment context and call-path evidence were not supplied by this external intelligence lookup.",
    },
    vpr_score: vprScore,
    vpr_truth_state: vprScore === null ? "UNMEASURABLE" : "INFERRED",
    vpr_context: vprContext ? { asset_criticality: vprContext.assetCriticality, network_exposure: vprContext.networkExposure, data_classification: vprContext.dataClassification, exploit_available: vprContext.exploitAvailable, truth_state: "DECLARED" } : null,
    vpr_method: "ELITZE VPR compatibility formula; clamped to 0–10 and rounded to one decimal. Requires explicit caller-supplied asset context; not a vendor VPR score.",
    priority_signal_score: prioritySignal,
    priority_signal_truth_state: prioritySignal === null ? "UNMEASURABLE" : "INFERRED",
    priority_signal_method: "ELITZE_TRIAGE_V1: CVSS × 7 + EPSS × 30 + 15 when listed in CISA KEV; capped at 100. This is a transparent triage signal, not a vendor VPR score or proof of exploitability.",
  };
}
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const mode = (params.get("mode") ?? "cve").trim().toLowerCase();
  const query = (params.get("q") ?? "").trim().slice(0, 240);
  if (!modeSet.has(mode)) return NextResponse.json({ ok: false, error: "invalid_mode", truth_state: "UNMEASURABLE", evidence_reference: null }, { status: 400 });
  if (!query && mode !== "kev") return NextResponse.json({ ok: false, error: "query_required", truth_state: "UNMEASURABLE", evidence_reference: null }, { status: 400 });
  const vprContext = parseVprContext(params);

  try {
    let results: any[] = [];
    const sourceStates: Record<string, string> = {};

    const ecosystem = params.get("ecosystem")?.trim() || null;
    if (mode === "kev") {
      try { results = await cisaKev(query); sourceStates.cisaKev = "LIVE"; }
      catch { sourceStates.cisaKev = "UNAVAILABLE"; }
    } else if (mode === "osv") {
      try {
        results = await osvById(query);
        sourceStates.osv = "LIVE";
      } catch {
        try {
          results = await osvByPackage(query, ecosystem);
          sourceStates.osv = "LIVE";
        } catch { sourceStates.osv = "UNAVAILABLE"; }
      }
    } else if (mode === "advisory" || mode === "ghsa") {
      try { results = await githubAdvisories(query); sourceStates.githubAdvisory = "LIVE"; }
      catch { sourceStates.githubAdvisory = "UNAVAILABLE"; }
      results = await enrichEpss(results);
    } else if (mode === "cve" || mode === "package") {
      try { results = await nvd(query); sourceStates.nvd = "LIVE"; }
      catch { sourceStates.nvd = "UNAVAILABLE"; }
      if (mode === "package") {
        try {
          const osvResults = await osvByPackage(query, ecosystem);
          results.push(...osvResults);
          sourceStates.osv = "LIVE";
        } catch { sourceStates.osv = "UNAVAILABLE"; }
      }
      results = await enrichEpss(results);
    } else {
      const [kevResults, nvdResults, advisoryResults] = await Promise.allSettled([
        cisaKev(query), nvd(query), githubAdvisories(query),
      ]);
      if (kevResults.status === "fulfilled") { results.push(...kevResults.value); sourceStates.cisaKev = "LIVE"; }
      else sourceStates.cisaKev = "UNAVAILABLE";
      if (nvdResults.status === "fulfilled") { results.push(...nvdResults.value); sourceStates.nvd = "LIVE"; }
      else sourceStates.nvd = "UNAVAILABLE";
      if (advisoryResults.status === "fulfilled") { results.push(...advisoryResults.value); sourceStates.githubAdvisory = "LIVE"; }
      else sourceStates.githubAdvisory = "UNAVAILABLE";
      results = await enrichEpss(results);
    }

    const observedAt = new Date().toISOString();
    const deduped = [...new Map(results.map((item) => [item.source + ":" + item.id + ":" + item.title, item])).values()]
      .slice(0, 30)
      .map((item) => attachTriageEvidence(item, observedAt, vprContext));

    return NextResponse.json({
      ok: true,
      query,
      mode,
      truth_state: Object.values(sourceStates).some((state) => state === "LIVE") ? "OBSERVED" : "UNMEASURABLE",
      evidence_reference: { sources: sourceStates, observed_at: observedAt },
      vpr_context_state: vprContext ? "DECLARED" : "UNMEASURABLE",
      observedAt,
      sourceStates,
      resultCount: deduped.length,
      results: deduped,
      truthNote: "Live external intelligence is discovery evidence only. It does not prove customer exposure, exploitability, or compromise.",
    }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("ELITZE vulnerability intelligence failed", error);
    return NextResponse.json({ ok: false, error: "vulnerability_intelligence_unavailable", truth_state: "UNMEASURABLE", evidence_reference: null }, { status: 503 });
  }
}
