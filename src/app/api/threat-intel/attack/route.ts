import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const ATTACK_STIX_URL = "https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json";
const CACHE_TTL_MS = 60 * 60 * 1000;
const MAX_STIX_BYTES = 60 * 1024 * 1024;

type Technique = {
  id: string;
  name: string;
  description: string;
  tactics: string[];
  platforms: string[];
  url: string;
  modified: string | null;
  subTechnique: boolean;
};

let cache: { expiresAt: number; modified: string | null; techniques: Technique[] } | null = null;

function toTechnique(object: Record<string, unknown>): Technique | null {
  if (object.type !== "attack-pattern" || object.revoked === true || object.x_mitre_deprecated === true) return null;
  const domains = Array.isArray(object.x_mitre_domains) ? object.x_mitre_domains : [];
  if (domains.length && !domains.includes("enterprise-attack")) return null;
  const refs = Array.isArray(object.external_references) ? object.external_references as Array<Record<string, unknown>> : [];
  const ref = refs.find((item) => item.source_name === "mitre-attack" && typeof item.external_id === "string");
  const id = typeof ref?.external_id === "string" ? ref.external_id.trim() : "";
  if (!/^T\d{4}(?:\.\d{3})?$/.test(id) || typeof object.name !== "string") return null;

  const phases = Array.isArray(object.kill_chain_phases) ? object.kill_chain_phases as Array<Record<string, unknown>> : [];
  const tactics = [...new Set(phases
    .filter((phase) => phase.kill_chain_name === "mitre-attack" && typeof phase.phase_name === "string")
    .map((phase) => String(phase.phase_name).replaceAll("-", " ")))];
  const platforms = Array.isArray(object.x_mitre_platforms)
    ? object.x_mitre_platforms.filter((item): item is string => typeof item === "string").slice(0, 16)
    : [];
  const description = typeof object.description === "string" ? object.description.trim().slice(0, 1200) : "";
  const path = id.includes(".") ? id.replace(".", "/") : id;
  return {
    id,
    name: object.name.slice(0, 200),
    description,
    tactics,
    platforms,
    url: "https://attack.mitre.org/techniques/" + path + "/",
    modified: typeof object.modified === "string" ? object.modified : null,
    subTechnique: id.includes("."),
  };
}

async function loadTechniques() {
  if (cache && cache.expiresAt > Date.now()) return cache;
  const response = await fetch(ATTACK_STIX_URL, {
    headers: { accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  });
  if (!response.ok) throw new Error("mitre_attack_source_http_" + response.status);
  const contentLength = Number(response.headers.get("content-length") ?? 0);
  if (contentLength > MAX_STIX_BYTES) throw new Error("mitre_attack_dataset_too_large");
  const raw = await response.text();
  if (Buffer.byteLength(raw, "utf8") > MAX_STIX_BYTES) throw new Error("mitre_attack_dataset_too_large");
  const bundle = JSON.parse(raw) as {
    objects?: Array<Record<string, unknown>>;
  };
  if (!Array.isArray(bundle.objects)) throw new Error("mitre_attack_dataset_invalid");
  const techniques = bundle.objects.map(toTechnique).filter((item): item is Technique => Boolean(item));
  if (!techniques.length) throw new Error("mitre_attack_dataset_empty");
  const modified = techniques.reduce<string | null>((latest, item) => {
    if (!item.modified) return latest;
    return !latest || item.modified > latest ? item.modified : latest;
  }, null);
  cache = { expiresAt: Date.now() + CACHE_TTL_MS, modified, techniques };
  return cache;
}

export async function GET(request: NextRequest) {
  // MITRE ATT&CK is public source material. This endpoint exposes only public technique metadata,
  // never tenant records or secrets, so public SEO pages and authenticated consoles share it.
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase().slice(0, 100);
  const tactic = (request.nextUrl.searchParams.get("tactic") ?? "").trim().toLowerCase().replaceAll("-", " ").slice(0, 80);
  const limit = Math.max(1, Math.min(100, Number(request.nextUrl.searchParams.get("limit") ?? 30) || 30));
  const offset = Math.max(0, Math.min(5000, Number(request.nextUrl.searchParams.get("offset") ?? 0) || 0));

  try {
    const dataset = await loadTechniques();
    const matched = dataset.techniques.filter((technique) => {
      const text = (technique.id + " " + technique.name + " " + technique.description + " " + technique.tactics.join(" ") + " " + technique.platforms.join(" ")).toLowerCase();
      return (!q || text.includes(q)) && (!tactic || technique.tactics.some((item) => item.toLowerCase() === tactic));
    });
    return NextResponse.json({
      ok: true,
      source: "MITRE ATT&CK official Enterprise STIX 2.1 dataset",
      sourceUrl: ATTACK_STIX_URL,
      retrievedAt: new Date().toISOString(),
      datasetModifiedAt: dataset.modified,
      cacheExpiresAt: new Date(dataset.expiresAt).toISOString(),
      framework: "MITRE ATT&CK Enterprise",
      evidenceState: "OBSERVED",
      matchedCount: matched.length,
      offset,
      limit,
      techniques: matched.slice(offset, offset + limit),
    }, { headers: { "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=600" } });
  } catch (error) {
    console.error("ELITZE MITRE ATT&CK retrieval failed", error);
    return NextResponse.json({
      ok: false,
      error: "mitre_attack_source_unavailable",
      evidenceState: "UNMEASURABLE",
      sourceUrl: ATTACK_STIX_URL,
    }, { status: 503, headers: { "cache-control": "no-store" } });
  }
}
