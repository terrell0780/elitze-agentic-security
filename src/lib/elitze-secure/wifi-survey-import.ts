import { Buffer } from "node:buffer";

export type WifiAccessPointObservation = {
  bssid: string;
  channel: number | null;
  privacy: string | null;
  cipher: string | null;
  authentication: string | null;
  power: number | null;
  beaconCount: number | null;
  essid: string | null;
};

const MAX_CSV_BYTES = 1024 * 1024;
const MAX_ACCESS_POINTS = 500;

function parseRecords(input: string): string[][] {
  const records: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"' && field.trim().length === 0) {
      field = "";
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n" || char === "\r") {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      row.push(field.trim());
      if (row.some((item) => item.length > 0)) records.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (quoted) throw new Error("wifi_csv_unclosed_quote");
  if (field.length || row.length) {
    row.push(field.trim());
    if (row.some((item) => item.length > 0)) records.push(row);
  }
  return records;
}

function numeric(value: string | undefined, min: number, max: number): number | null {
  if (!value || !/^-?\d+$/.test(value.trim())) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= min && parsed <= max ? parsed : null;
}

/**
 * Parses the access-point section of a CSV network survey. Station/client
 * records and columns such as recovered keys are deliberately ignored.
 */
export function parseWifiSurveyCsv(csv: string): WifiAccessPointObservation[] {
  if (typeof csv !== "string" || !csv.trim()) throw new Error("wifi_csv_required");
  if (Buffer.byteLength(csv, "utf8") > MAX_CSV_BYTES) throw new Error("wifi_csv_too_large");

  const records = parseRecords(csv);
  let columns: Map<string, number> | null = null;
  const observed: WifiAccessPointObservation[] = [];
  const seen = new Set<string>();

  for (const row of records) {
    const first = (row[0] ?? "").trim().toLowerCase();
    if (first === "station mac") break;
    if (first === "bssid" && row.some((value) => /first time seen/i.test(value))) {
      columns = new Map(row.map((value, index) => [value.trim().toLowerCase(), index]));
      continue;
    }
    if (!columns) continue;

    const get = (key: string) => {
      const index = columns?.get(key.toLowerCase());
      return index === undefined ? undefined : row[index];
    };
    const bssid = (get("BSSID") ?? "").toLowerCase().trim();
    if (!/^([0-9a-f]{2}:){5}[0-9a-f]{2}$/.test(bssid) || seen.has(bssid)) continue;

    const ssid = (get("ESSID") ?? "").trim();
    observed.push({
      bssid,
      channel: numeric(get("channel"), 1, 233),
      privacy: get("Privacy")?.slice(0, 100) || null,
      cipher: get("Cipher")?.slice(0, 100) || null,
      authentication: get("Authentication")?.slice(0, 100) || null,
      power: numeric(get("Power"), -127, 127),
      beaconCount: numeric(get("# beacons"), 0, 2147483647),
      essid: ssid ? ssid.slice(0, 256) : null,
    });
    seen.add(bssid);
    if (observed.length >= MAX_ACCESS_POINTS) break;
  }
  if (!columns) throw new Error("wifi_survey_access_point_header_required");
  return observed;
}
