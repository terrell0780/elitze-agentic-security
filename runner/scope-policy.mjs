import { isIP } from "node:net";

export const RUNNER_SCOPES = new Set([
  "authenticated-application",
  "public-surface",
  "agent-toolchain",
  "api",
]);

export const RUNNER_PROFILES = new Set([
  "release-assurance",
  "api-security",
  "agent-security",
  "mcp-security",
]);

const IPV4_DENY_CIDRS = [
  ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10],
  ["127.0.0.0", 8], ["169.254.0.0", 16], ["172.16.0.0", 12],
  ["192.0.0.0", 24], ["192.0.2.0", 24], ["192.88.99.0", 24],
  ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
  ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
];

function ipv4Number(address) {
  const parts = address.split(".");
  if (parts.length !== 4 || parts.some((part) => !/^\d{1,3}$/.test(part) || Number(part) > 255)) return null;
  return parts.reduce((value, part) => ((value << 8) | Number(part)) >>> 0, 0);
}

function ipv4InCidr(address, network, prefix) {
  const value = ipv4Number(address);
  const base = ipv4Number(network);
  if (value === null || base === null) return true;
  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
  return (value & mask) === (base & mask);
}

function ipv6Number(address) {
  let input = address.toLowerCase();
  if (input.includes("%")) return null;
  if (input.includes(".")) {
    const lastColon = input.lastIndexOf(":");
    const v4 = ipv4Number(input.slice(lastColon + 1));
    if (v4 === null) return null;
    const hi = ((v4 >>> 16) & 0xffff).toString(16);
    const lo = (v4 & 0xffff).toString(16);
    input = input.slice(0, lastColon + 1) + hi + ":" + lo;
  }
  const halves = input.split("::");
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(":") : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - left.length - right.length;
  if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const words = [...left, ...Array(missing).fill("0"), ...right];
  if (words.length !== 8 || words.some((word) => !/^[a-f0-9]{1,4}$/.test(word))) return null;
  return words.reduce((value, word) => (value << 16n) | BigInt(parseInt(word, 16)), 0n);
}

function ipv6RangeMatch(value, network, prefix) {
  const ip = ipv6Number(value);
  const base = ipv6Number(network);
  if (ip === null || base === null) return false;
  const mask = prefix === 0 ? 0n : ((1n << BigInt(prefix)) - 1n) << BigInt(128 - prefix);
  return (ip & mask) === (base & mask);
}

export function isPrivateIp(address) {
  const version = isIP(address);
  if (version === 0) return true;
  if (version === 4) {
    return IPV4_DENY_CIDRS.some(([network, prefix]) => ipv4InCidr(address, network, prefix));
  }

  const ip = ipv6Number(address);
  if (ip === null || ip === 0n || ip === 1n) return true;

  // IPv4-mapped IPv6 inherits the restrictions of its embedded IPv4 address.
  if (ipv6RangeMatch(address, "::ffff:0:0", 96)) {
    const embedded = Number(ip & 0xffffffffn);
    return isPrivateIp([embedded >>> 24, (embedded >>> 16) & 255, (embedded >>> 8) & 255, embedded & 255].join("."));
  }

  // Accept only global unicast 2000::/3; deny special-purpose/documentation/transition ranges.
  if (!ipv6RangeMatch(address, "2000::", 3)) return true;
  return (
    ipv6RangeMatch(address, "2001:db8::", 32) ||
    ipv6RangeMatch(address, "2001::", 23) ||
    ipv6RangeMatch(address, "2002::", 16) ||
    ipv6RangeMatch(address, "3fff::", 20)
  );
}

export function hostAuthorized(hostname, allowlist) {
  const host = String(hostname).toLowerCase().replace(/\.$/, "");
  return allowlist.some((entry) => {
    const allowed = String(entry).trim().toLowerCase().replace(/\.$/, "");
    if (!allowed) return false;
    if (allowed.startsWith("*.")) {
      const suffix = allowed.slice(2);
      return host !== suffix && host.endsWith("." + suffix);
    }
    return host === allowed;
  });
}
