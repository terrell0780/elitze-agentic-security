import assert from "node:assert/strict";
import fs from "node:fs";

const registry = fs.readFileSync("src/lib/elitze-secure/compliance-catalog.ts", "utf8");
const docs = fs.readFileSync("docs/ELITZE-GLOBAL-SECURITY-COMPLIANCE.md", "utf8");

for (const marker of ["CA-PIPEDA","CA-BC-PIPA","CA-QC-LAW25","EU-GDPR","EU-AI-ACT","EU-NIS2","EU-DORA","UK-UKGDPR","US-CCPA-CPRA","BR-LGPD","IN-DPDP","AU-PRIVACY-ACT","SG-PDPA","JP-APPI","KR-PIPA","CN-PIPL","ISO-27001","ISO-27701","ISO-42001","SOC2","NIST-CSF-2","NIST-AI-RMF","PCI-DSS","SAP-SECURITY-COMPLIANCE","PENTERA-VALIDATION","SPLUNK","CROWDSTRIKE","PALO-ALTO","IDENTITY-ENRA-OKTA","CLOUD-AWS-AZURE-GCP","DEVSECOPS-GITHUB","ITSM-SERVICENOW-JIRA","KUBERNETES"]) {
  assert.match(registry, new RegExp(marker));
}

for (const forbidden of ["fully compliant","legal advice","guaranteed"]) {
  assert.doesNotMatch(registry.toLowerCase(), new RegExp(forbidden));
}

for (const required of ["No evidence, no claim","PIPEDA","British Columbia PIPA","Quebec privacy","GDPR","EU AI Act","NIS2","DORA","CCPA/CPRA","SAP","Pentera","data residency","subprocessor","data processing agreement","cross-border transfer","incident response"]) {
  assert.ok(docs.toLowerCase().includes(required.toLowerCase()), required);
}

console.log("ELITZE global security/compliance catalog self-test: PASS");
