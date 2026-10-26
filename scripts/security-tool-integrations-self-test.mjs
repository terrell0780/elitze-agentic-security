import assert from "node:assert/strict";
import fs from "node:fs";
import { parseNmapXml, summarizeJohnOutput } from "../src/lib/elitze-secure/security-tool-integrations.ts";

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

const metasploitRoute = fs.readFileSync("src/app/api/integrations/security-tools/metasploit/observe/route.ts", "utf8");
const nmapRoute = fs.readFileSync("src/app/api/integrations/security-tools/nmap/import/route.ts", "utf8");
const johnRoute = fs.readFileSync("src/app/api/integrations/security-tools/john-the-ripper/import/route.ts", "utf8");
const integrationsPage = fs.readFileSync("src/app/integrations/page.tsx", "utf8");
const docs = fs.readFileSync("docs/SECURITY-TOOL-INTEGRATIONS.md", "utf8");
assert.match(metasploitRoute, /authorizeInternalRequest/);
assert.match(metasploitRoute, /moduleExecutionExposed: false/);
assert.match(nmapRoute, /authorizeInternalRequest/);
assert.match(nmapRoute, /rawXmlStored: false/);
assert.match(johnRoute, /plaintextPasswordsStored: false/);
assert.match(integrationsPage, /Nmap/);
assert.match(integrationsPage, /Metasploit Framework/);
assert.match(integrationsPage, /John the Ripper/);
assert.match(docs, /ELITZE_METASPLOIT_BRIDGE_URL/);
console.log("ELITZE Nmap / Metasploit / John the Ripper integration self-test: PASS");
