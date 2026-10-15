export type AgentDivision = "OFFENSIVE" | "DEFENSIVE" | "OPERATIONS";
export type SecurityTruthState = "OBSERVED" | "DECLARED" | "INFERRED" | "UNKNOWN" | "UNMEASURABLE";

export type AgentPassport = {
  id: string;
  name: string;
  role: string;
  division: AgentDivision;
  mission: string;
  documentedCapabilities: string[];
  authorizationBoundary: string;
  executionWindow: string;
  catalogTruthState: "DECLARED";
  runtimeTruthState: "UNKNOWN";
  sourceReference: string;
};

/**
 * ELITZE presentation of the 24 roles documented in the supplied Python source archive.
 * Source-derived role descriptions are catalog declarations, not proof of active agents,
 * permissions, execution windows, real findings or claimed performance metrics.
 */
const sourceReference = "supplied Python source archive: static/index.html and app.py agent prompt catalog";

export const agentPassports: AgentPassport[] = [
  {
    id: "ELITZE",
    name: "ELITZE",
    role: "Agentic Security Platform",
    division: "DEFENSIVE",
    mission: "Coordinate agent identity governance, MCP runtime controls, authorized security validation, and evidence-backed security operations.",
    documentedCapabilities: ["Agent identity and workload governance", "MCP server and tool reachability", "Pre-execution policy enforcement", "Authorized security testing", "Evidence collection and retesting"],
    authorizationBoundary: "Tenant-scoped policy applies. Sensitive actions require verified identity, explicit authorization, and approval where configured.",
    executionWindow: "Not verified — runtime activity requires connected execution evidence",
    catalogTruthState: "DECLARED",
    runtimeTruthState: "UNKNOWN",
    sourceReference: "ELITZE Agentic Security product definition"
  },
  {
    id: "SARA",
    name: "Sara",
    role: "ELITZE Security Assistant",
    division: "OPERATIONS",
    mission: "Help operators investigate security context, organize evidence, and prepare policy-aware recommendations within ELITZE authorization boundaries.",
    documentedCapabilities: ["Security investigation assistance", "Evidence and source summarization", "Policy-aware workflow guidance", "Report preparation", "Operator review support"],
    authorizationBoundary: "Sara does not grant its own permissions, bypass policy, or execute high-impact actions without the required authorization and approval.",
    executionWindow: "Not verified — runtime activity requires connected execution evidence",
    catalogTruthState: "DECLARED",
    runtimeTruthState: "UNKNOWN",
    sourceReference: "ELITZE Agentic Security product definition"
  }
];

export const securityTruthStates: ReadonlyArray<{ state: SecurityTruthState; meaning: string }> = [
  { state: "OBSERVED", meaning: "Directly measured or retrieved; source and observation context must be retained." },
  { state: "DECLARED", meaning: "Stated by a person, configuration or system; not independently verified." },
  { state: "INFERRED", meaning: "Derived from identified observations using a documented method." },
  { state: "UNKNOWN", meaning: "Available evidence is insufficient to determine the fact." },
  { state: "UNMEASURABLE", meaning: "The required measurement could not be performed with available access or telemetry." },
];
