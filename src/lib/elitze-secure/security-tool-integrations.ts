import { createHash } from "node:crypto";
import { isIP } from "node:net";

export type NmapPortObservation = {
  port: number;
  protocol: string;
  state: string;
  service?: string;
  product?: string;
  version?: string;
  tunnel?: string;
};

export type NmapHostObservation = {
  address: string;
  addressType: string;
  status: string;
  hostnames: string[];
  openPorts: NmapPortObservation[];
};

const MAX_NMAP_XML_BYTES = 2 * 1024 * 1024;
const MAX_NMAP_HOSTS = 500;
const MAX_OPEN_PORTS_PER_HOST = 100;
const MAX_JOHN_OUTPUT_BYTES = 1024 * 1024;

function decodeXmlAttribute(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'");
}

function attributes(source: string): Record<string, string> {
  const result: Record<string, string> = {};
  const pattern = /([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  for (const match of source.matchAll(pattern)) {
    result[match[1]] = decodeXmlAttribute(match[2] ?? match[3] ?? "");
  }
  return result;
}

function findTagAttributes(source: string, tag: string): Record<string, string> | null {
  const escaped = tag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = source.match(new RegExp(`<${escaped}\\b([^>]*)/?>`, "i"));
  return match ? attributes(match[1]) : null;
}

/**
 * Parse the safe, machine-readable subset of Nmap XML used for asset evidence.
 * The importer rejects DTD/entity declarations and never stores raw scan XML or
 * NSE script output. Only hosts with valid IP addresses and ports in state=open
 * are represented as confirmed open service observations.
 */
export function parseNmapXml(xml: string): NmapHostObservation[] {
  if (typeof xml !== "string" || xml.trim().length === 0) throw new Error("nmap_xml_required");
  if (Buffer.byteLength(xml, "utf8") > MAX_NMAP_XML_BYTES) throw new Error("nmap_xml_too_large");
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml)) throw new Error("nmap_xml_dtd_not_allowed");
  if (!/<nmaprun(?:\s|>)/i.test(xml)) throw new Error("nmap_xml_root_invalid");

  const hosts: NmapHostObservation[] = [];
  const hostPattern = /<host\b[^>]*>([\s\S]*?)<\/host\s*>/gi;
  for (const hostMatch of xml.matchAll(hostPattern)) {
    if (hosts.length >= MAX_NMAP_HOSTS) throw new Error("nmap_host_limit_exceeded");
    const block = hostMatch[1];
    const status = findTagAttributes(block, "status")?.state ?? "unknown";
    const addresses: Array<{ address: string; type: string }> = [];
    for (const addressMatch of block.matchAll(/<address\b([^>]*?)(?:\/\s*>|>)/gi)) {
      const attr = attributes(addressMatch[1]);
      const address = attr.addr?.trim() ?? "";
      const type = attr.addrtype?.trim() ?? "";
      if (address && isIP(address)) addresses.push({ address, type });
    }
    const address = addresses.find((item) => item.type === "ipv4") ?? addresses.find((item) => item.type === "ipv6") ?? addresses[0];
    if (!address || status !== "up") continue;

    const hostnames: string[] = [];
    for (const match of block.matchAll(/<hostname\b([^>]*?)(?:\/\s*>|>)/gi)) {
      const name = attributes(match[1]).name?.trim();
      if (name && name.length <= 253 && hostnames.length < 10) hostnames.push(name);
    }

    const openPorts: NmapPortObservation[] = [];
    for (const portMatch of block.matchAll(/<port\b([^>]*)>([\s\S]*?)<\/port\s*>/gi)) {
      const portAttr = attributes(portMatch[1]);
      const port = Number(portAttr.portid);
      const protocol = portAttr.protocol?.toLowerCase() ?? "tcp";
      const portBlock = portMatch[2];
      const state = findTagAttributes(portBlock, "state")?.state ?? "unknown";
      if (!Number.isInteger(port) || port < 1 || port > 65535 || state !== "open") continue;
      const service = findTagAttributes(portBlock, "service");
      openPorts.push({
        port,
        protocol: ["tcp", "udp", "sctp"].includes(protocol) ? protocol : "unknown",
        state,
        ...(service?.name ? { service: service.name.slice(0, 100) } : {}),
        ...(service?.product ? { product: service.product.slice(0, 150) } : {}),
        ...(service?.version ? { version: service.version.slice(0, 100) } : {}),
        ...(service?.tunnel ? { tunnel: service.tunnel.slice(0, 50) } : {}),
      });
      if (openPorts.length >= MAX_OPEN_PORTS_PER_HOST) break;
    }

    hosts.push({
      address: address.address,
      addressType: address.type || (isIP(address.address) === 4 ? "ipv4" : "ipv6"),
      status,
      hostnames,
      openPorts,
    });
  }
  return hosts;
}

export type JohnAuditSummary = {
  crackedCount: number;
  remainingCount: number | null;
  accountRecordsObserved: number;
  summaryObserved: boolean;
  accountReferences: string[];
};

/**
 * Summarize John the Ripper --show output without returning or storing
 * plaintext passwords. Account labels are represented only by one-way hashes.
 */
export function summarizeJohnOutput(output: string): JohnAuditSummary {
  if (typeof output !== "string" || output.trim().length === 0) throw new Error("john_output_required");
  if (Buffer.byteLength(output, "utf8") > MAX_JOHN_OUTPUT_BYTES) throw new Error("john_output_too_large");

  let summaryCracked: number | null = null;
  let summaryRemaining: number | null = null;
  let accountRecordsObserved = 0;
  let recoveredRows = 0;
  const accountReferences: string[] = [];
  for (const line of output.split(/\r?\n/).slice(0, 10_000)) {
    const summary = line.match(/(\d+)\s+passwords?\s+hash(?:es)?\s+cracked,\s*(\d+)\s+left/i);
    if (summary) {
      summaryCracked = Number(summary[1]);
      summaryRemaining = Number(summary[2]);
      continue;
    }
    if (!line || !line.includes(":") || accountRecordsObserved >= 5000) continue;
    const fields = line.split(":");
    const account = fields[0]?.trim() ?? "";
    const recovered = (fields[1] ?? "").length > 0;
    if (!account || account.length > 256 || fields.length < 2) continue;
    accountRecordsObserved += 1;
    if (recovered) recoveredRows += 1;
    // Hash the account label only; never hash, return, or persist the password field.
    const reference = createHash("sha256").update(account, "utf8").digest("hex").slice(0, 20);
    if (!accountReferences.includes(reference)) accountReferences.push(reference);
  }

  return {
    crackedCount: summaryCracked ?? recoveredRows,
    remainingCount: summaryRemaining,
    accountRecordsObserved,
    summaryObserved: summaryCracked !== null,
    accountReferences: accountReferences.slice(0, 5000),
  };
}

export type MetasploitBridgeOperation = "health" | "sessions";
export type MetasploitSessionObservation = {
  id: string;
  type: string;
  target: string | null;
  openedAt: string | null;
};

export type MetasploitBridgeResult =
  | { ok: true; operation: "health"; version: string | null }
  | { ok: true; operation: "sessions"; sessions: MetasploitSessionObservation[] }
  | { ok: false; status: "NOT_CONFIGURED" | "UNAVAILABLE" | "INVALID_RESPONSE"; error: string };

function getMetasploitBridgeConfig(): { baseUrl: URL; token: string } | null {
  const rawUrl = process.env.ELITZE_METASPLOIT_BRIDGE_URL?.trim();
  const token = process.env.ELITZE_METASPLOIT_BRIDGE_TOKEN?.trim();
  if (!rawUrl || !token) return null;
  try {
    const baseUrl = new URL(rawUrl);
    if (baseUrl.protocol !== "https:" || baseUrl.username || baseUrl.password || baseUrl.search || baseUrl.hash) return null;
    baseUrl.pathname = baseUrl.pathname.replace(/\/$/, "");
    return { baseUrl, token };
  } catch {
    return null;
  }
}

function safeString(value: unknown, maxLength = 100): string | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const result = String(value).trim();
  return result && result.length <= maxLength && !/[\r\n\0]/.test(result) ? result : null;
}

/**
 * Connects only to a separately deployed, HTTPS Metasploit bridge. The bridge
 * translates the supported read-only operations to the local MessagePack RPC
 * interface. This web application does not expose arbitrary module execution.
 */
export async function observeMetasploitBridge(
  operation: MetasploitBridgeOperation,
  tenantId: string,
): Promise<MetasploitBridgeResult> {
  const config = getMetasploitBridgeConfig();
  if (!config) return { ok: false, status: "NOT_CONFIGURED", error: "metasploit_https_bridge_url_and_token_required" };

  const path = operation === "health" ? "/v1/health" : "/v1/sessions";
  const endpoint = new URL(path, config.baseUrl.toString().replace(/\/$/, "") + "/");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${config.token}`,
        "X-ELITZE-Tenant-ID": tenantId,
      },
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (!response.ok) return { ok: false, status: "UNAVAILABLE", error: `metasploit_bridge_http_${response.status}` };
    const payload: unknown = await response.json().catch(() => null);
    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return { ok: false, status: "INVALID_RESPONSE", error: "metasploit_bridge_json_required" };
    }
    const record = payload as Record<string, unknown>;
    if (operation === "health") {
      const healthy = record.ok === true || record.status === "ok" || record.status === "healthy";
      if (!healthy) return { ok: false, status: "INVALID_RESPONSE", error: "metasploit_bridge_health_not_confirmed" };
      return { ok: true, operation, version: safeString(record.version, 100) };
    }
    if (!Array.isArray(record.sessions)) return { ok: false, status: "INVALID_RESPONSE", error: "metasploit_bridge_sessions_array_required" };
    const sessions: MetasploitSessionObservation[] = [];
    for (const item of record.sessions.slice(0, 100)) {
      if (!item || typeof item !== "object" || Array.isArray(item)) continue;
      const session = item as Record<string, unknown>;
      const id = safeString(session.id ?? session.session_id, 100);
      if (!id) continue;
      sessions.push({
        id,
        type: safeString(session.type ?? session.session_type, 100) ?? "unknown",
        target: safeString(session.target ?? session.session_host ?? session.target_host, 253),
        openedAt: safeString(session.opened_at ?? session.openedAt, 50),
      });
    }
    return { ok: true, operation, sessions };
  } catch {
    return { ok: false, status: "UNAVAILABLE", error: "metasploit_bridge_request_failed" };
  } finally {
    clearTimeout(timer);
  }
}
