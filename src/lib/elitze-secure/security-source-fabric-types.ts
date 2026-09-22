export const SECURITY_CONNECTOR_IDS = [
  "opencti","misp","thehive","wazuh","velociraptor","suricata","zeek","osquery","fleetdm",
  "greenbone","nuclei","cisa-kev","epss","nvd","github-advisories","mitre-attack","sigma","yara",
] as const;

export type SecurityConnectorId = typeof SECURITY_CONNECTOR_IDS[number];
export type ConnectorMode = "API" | "COLLECTOR" | "SCANNER" | "REFERENCE";
export type ConnectorHealth = "CONNECTED" | "NOT_CONFIGURED" | "UNAVAILABLE" | "ERROR";
export type ConnectorIntegrationState = "IMPLEMENTED" | "INTEGRATED" | "PLANNED" | "BLOCKED";

export type SecurityConnectorDefinition = {
  id: SecurityConnectorId;
  name: string;
  mode: ConnectorMode;
  domains: string[];
  purpose: string;
  credentialEnv: string[];
  endpointEnv?: string;
  defaultEndpoint?: string;
  executionBoundary: "READ_ONLY" | "INGEST_ONLY" | "APPROVAL_REQUIRED";
  notes: string;
};

export type SecurityConnectorStatus = SecurityConnectorDefinition & {
  configured: boolean;
  integrationState: ConnectorIntegrationState;
  health: ConnectorHealth;
  lastObservedAt: string | null;
  lastError: string | null;
};

const definitions = [
  ["opencti","OpenCTI","API",["THREAT_INTEL","SECOPS"],"STIX threat-intelligence graph context.",["ELITZE_OPENCTI_TOKEN"],"ELITZE_OPENCTI_URL","https://opencti.example.invalid/graphql","READ_ONLY","GraphQL read path."],
  ["misp","MISP","API",["THREAT_INTEL"],"IOC and event intelligence.",["ELITZE_MISP_TOKEN"],"ELITZE_MISP_URL","https://misp.example.invalid","READ_ONLY","API token is never written to evidence."],
  ["thehive","TheHive","API",["SECOPS"],"Case, alert, observable and investigation context.",["ELITZE_THEHIVE_TOKEN"],"ELITZE_THEHIVE_URL","https://thehive.example.invalid","APPROVAL_REQUIRED","Reads supported; mutations require authorization."],
  ["wazuh","Wazuh","API",["ENDPOINT","SECOPS"],"Endpoint alerts, inventory and detection context.",["ELITZE_WAZUH_USERNAME","ELITZE_WAZUH_PASSWORD"],"ELITZE_WAZUH_URL","https://wazuh.example.invalid:55000","READ_ONLY","Uses Wazuh API authentication."],
  ["velociraptor","Velociraptor","COLLECTOR",["ENDPOINT","SECOPS"],"DFIR collection and hunting results.",["ELITZE_INGEST_HMAC_SECRET"],"ELITZE_VELOCIRAPTOR_GRPC_TARGET",undefined,"APPROVAL_REQUIRED","External collector or runner."],
  ["suricata","Suricata","COLLECTOR",["NETWORK"],"EVE network IDS telemetry.",["ELITZE_INGEST_HMAC_SECRET"],undefined,undefined,"INGEST_ONLY","Real EVE JSON ingestion."],
  ["zeek","Zeek","COLLECTOR",["NETWORK"],"Network connection and protocol telemetry.",["ELITZE_INGEST_HMAC_SECRET"],undefined,undefined,"INGEST_ONLY","Real JSON log ingestion."],
  ["osquery","OSQuery","COLLECTOR",["ENDPOINT"],"Endpoint inventory and query observations.",["ELITZE_INGEST_HMAC_SECRET"],undefined,undefined,"INGEST_ONLY","Customer-side query execution."],
  ["fleetdm","FleetDM","API",["ENDPOINT"],"Fleet host and endpoint-management context.",["ELITZE_FLEETDM_TOKEN"],"ELITZE_FLEETDM_URL","https://fleet.example.invalid","READ_ONLY","Bearer-token API path."],
  ["greenbone","OpenVAS / Greenbone","SCANNER",["VULNERABILITY","NETWORK"],"Vulnerability assessment results.",["ELITZE_INGEST_HMAC_SECRET"],"ELITZE_GREENBONE_URL",undefined,"INGEST_ONLY","GMP/OSP lives behind the external runner."],
  ["nuclei","Nuclei","SCANNER",["APPLICATION","NETWORK"],"Template-based exposure findings.",["ELITZE_INGEST_HMAC_SECRET"],"ELITZE_NUCLEI_RUNNER_URL",undefined,"APPROVAL_REQUIRED","Isolated runner and JSONL ingestion."],
  ["cisa-kev","CISA KEV","REFERENCE",["THREAT_INTEL","VULNERABILITY"],"Known exploited vulnerability reference.",[],undefined,"https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json","READ_ONLY","Public catalog."],
  ["epss","EPSS","REFERENCE",["THREAT_INTEL","VULNERABILITY"],"Exploit prediction enrichment.",[],undefined,"https://api.first.org/data/v1/epss","READ_ONLY","External enrichment."],
  ["nvd","NVD","REFERENCE",["VULNERABILITY"],"CVE metadata enrichment.",[],undefined,"https://services.nvd.nist.gov/rest/json/cves/2.0","READ_ONLY","External vulnerability evidence."],
  ["github-advisories","GitHub Advisories","API",["APPLICATION","VULNERABILITY"],"Package and ecosystem advisory enrichment.",["ELITZE_GITHUB_ADVISORIES_TOKEN"],"ELITZE_GITHUB_ADVISORIES_URL","https://api.github.com/advisories","READ_ONLY","Advisory Database API/GraphQL access."],
  ["mitre-attack","MITRE ATT&CK","REFERENCE",["THREAT_INTEL","SECOPS"],"Technique and tactic knowledge from official STIX.",[],undefined,"https://raw.githubusercontent.com/mitre-attack/attack-stix-data/master/enterprise-attack/enterprise-attack.json","READ_ONLY","Reference knowledge only."],
  ["sigma","Sigma","REFERENCE",["SECOPS"],"Vendor-neutral detection rule knowledge.",[],undefined,"https://sigmahq.io/sigma-specification/","READ_ONLY","Preserve source attribution."],
  ["yara","YARA","REFERENCE",["ENDPOINT","APPLICATION"],"Malware and file detection rule knowledge.",[],undefined,"https://yara.readthedocs.io/","READ_ONLY","Execution stays in a customer-side runner."],
] as const;

export const SECURITY_CONNECTORS: SecurityConnectorDefinition[] = definitions.map(
  ([id,name,mode,domains,purpose,credentialEnv,endpointEnv,defaultEndpoint,executionBoundary,notes]) => ({
    id: id as SecurityConnectorId,
    name,
    mode: mode as ConnectorMode,
    domains: [...domains],
    purpose,
    credentialEnv: [...credentialEnv],
    endpointEnv: endpointEnv ?? undefined,
    defaultEndpoint: defaultEndpoint ?? undefined,
    executionBoundary: executionBoundary as SecurityConnectorDefinition["executionBoundary"],
    notes,
  }),
);

const map = new Map(SECURITY_CONNECTORS.map((item) => [item.id,item]));
export function getSecurityConnector(id: SecurityConnectorId) { return map.get(id)!; }
export function isSecurityConnectorId(value: string): value is SecurityConnectorId { return map.has(value as SecurityConnectorId); }
