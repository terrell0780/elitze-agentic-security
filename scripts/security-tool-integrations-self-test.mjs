import assert from "node:assert/strict";
import fs from "node:fs";
import { parseNmapXml, summarizeJohnOutput } from "../src/lib/elitze-secure/security-tool-integrations.ts";
import { parseWifiSurveyCsv } from "../src/lib/elitze-secure/wifi-survey-import.ts";

const nmap = `<?xml version="1.0"?>
<nmaprun scanner="nmap">
  <host>
    <status state="up" reason="syn-ack"/>
    <address addr="192.0.2.10" addrtype="ipv4"/>
    <hostnames><hostname name="test-target.example" type="PTR"/></hostnames>
    <ports>
      <port protocol="tcp" portid="22"><state state="open" reason="syn-ack"/><service name="ssh" product="OpenSSH" version="9.0"/></port>
      <port protocol="tcp" portid="80"><state state="closed" reason="reset"/><service name="http"/></port>
    </ports>
    <hostscript><script id="demo" output="must not be persisted"/></hostscript>
  </host>
  <host><status state="down"/><address addr="192.0.2.11" addrtype="ipv4"/></host>
</nmaprun>`;
const hosts = parseNmapXml(nmap);
assert.equal(hosts.length, 1);
assert.equal(hosts[0].address, "192.0.2.10");
assert.deepEqual(hosts[0].hostnames, ["test-target.example"]);
assert.equal(hosts[0].openPorts.length, 1);
assert.equal(hosts[0].openPorts[0].port, 22);
assert.equal(hosts[0].openPorts[0].service, "ssh");
assert.throws(() => parseNmapXml("<!DOCTYPE nmaprun [<!ENTITY x SYSTEM 'file:///etc/passwd'>]><nmaprun/>"), /dtd_not_allowed/);
assert.throws(() => parseNmapXml("<wrong/>"), /root_invalid/);

const johnOutput = "alice:training-only-secret:1000:1000:Alice:/home/alice:/bin/bash\n1 password hash cracked, 2 left\n";
const summary = summarizeJohnOutput(johnOutput);
assert.equal(summary.crackedCount, 1);
assert.equal(summary.remainingCount, 2);
assert.equal(summary.accountRecordsObserved, 1);
assert.equal(summary.summaryObserved, true);
assert.equal(JSON.stringify(summary).includes("training-only-secret"), false);
assert.equal(JSON.stringify(summary).includes("alice"), false);
assert.throws(() => summarizeJohnOutput(""), /output_required/);
assert.throws(() => parseNmapXml("<nmaprun/>".repeat(300_000)), /too_large/);

const wifiCsv = `BSSID, First time seen, Last time seen, channel, Speed, Privacy, Cipher, Authentication, Power, "# beacons", "# IV", LAN IP, ID-length, ESSID, Key
AA:BB:CC:DD:EE:FF, 2026-01-01 10:00:00, 2026-01-01 10:01:00, 6, 54, WPA2, CCMP, PSK, -45, 200, 0, , 12, "Office, guest", 
11:22:33:44:55:66, 2026-01-01 10:00:00, 2026-01-01 10:01:00, 11, 54, WPA2, CCMP, PSK, -60, 100, 0, , 8, Staff, recovered-key-should-be-ignored

Station MAC, First time seen, Last time seen, Power, # packets, BSSID, Probed ESSIDs
00:11:22:33:44:55, 2026-01-01 10:00:00, 2026-01-01 10:01:00, -35, 20, AA:BB:CC:DD:EE:FF, Office`;
const wifi = parseWifiSurveyCsv(wifiCsv);
assert.equal(wifi.length, 2);
assert.equal(wifi[0].bssid, "aa:bb:cc:dd:ee:ff");
assert.equal(wifi[0].essid, "Office, guest");
assert.equal(wifi[0].channel, 6);
assert.equal(JSON.stringify(wifi).includes("recovered-key-should-be-ignored"), false);
assert.equal(JSON.stringify(wifi).includes("00:11:22:33:44:55"), false);
assert.throws(() => parseWifiSurveyCsv(""), /csv_required/);


const metasploitRoute = fs.readFileSync("src/app/api/integrations/security-tools/metasploit/observe/route.ts", "utf8");
const nmapRoute = fs.readFileSync("src/app/api/integrations/security-tools/nmap/import/route.ts", "utf8");
const johnRoute = fs.readFileSync("src/app/api/integrations/security-tools/john-the-ripper/import/route.ts", "utf8");
const integrationsPage = fs.readFileSync("src/app/integrations/page.tsx", "utf8");
const wifiRoute = fs.readFileSync("src/app/api/integrations/security-tools/aircrack-ng/import/route.ts", "utf8");
const wifiDocs = fs.readFileSync("docs/SECURITY-TOOL-INTEGRATIONS.md", "utf8");
const docs = fs.readFileSync("docs/SECURITY-TOOL-INTEGRATIONS.md", "utf8");
assert.match(metasploitRoute, /authorizeInternalRequest/);
assert.match(metasploitRoute, /moduleExecutionExposed: false/);
assert.match(wifiRoute, /authorizeInternalRequest/);
assert.match(wifiRoute, /recoveredKeysStored: false/);
assert.match(wifiDocs, /Aircrack-ng/);
assert.match(nmapRoute, /authorizeInternalRequest/);
assert.match(nmapRoute, /rawXmlStored: false/);
assert.match(johnRoute, /plaintextPasswordsStored: false/);
assert.match(integrationsPage, /Nmap/);
assert.match(integrationsPage, /Metasploit Framework/);
assert.match(integrationsPage, /John the Ripper/);
assert.match(integrationsPage, /Aircrack-ng/);
assert.match(docs, /ELITZE_METASPLOIT_BRIDGE_URL/);
console.log("ELITZE Nmap / Metasploit / John the Ripper / Aircrack-ng integration self-test: PASS");
