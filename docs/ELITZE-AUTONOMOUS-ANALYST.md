# ELITZE Autonomous Analyst and Security Source Fabric

The ELITZE Autonomous Analyst sits above one evidence fabric:

Security Sources -> Normalize -> Security Fabric -> Security Graph -> Autonomous Analyst -> Evidence-bound finding -> ELITZE Policy -> Approved action

The source catalog contains:

- OpenCTI, MISP, TheHive for threat-intelligence and investigation context.
- Wazuh, Velociraptor, Suricata, Zeek, OSQuery and FleetDM for endpoint and network observations.
- OpenVAS / Greenbone and Nuclei for isolated vulnerability-scanner results.
- CISA KEV, EPSS, NVD and GitHub Advisories for vulnerability enrichment.
- MITRE ATT&CK for technique and tactic knowledge.
- Sigma and YARA for detection-rule knowledge.

Connector transport is deliberately modeled instead of pretending that every system is a REST API. API systems use provider APIs, Suricata and Zeek use collector ingestion, scanner systems use isolated runners, and knowledge sources are reference integrations.

## Dashboard

The new console surface is /console/analyst.

It contains:

- Executive Dashboard
- Threat Intel
- Assets
- CVEs
- Agents
- Active Threats, Critical Assets, KEV, EPSS, VPR and Risk evidence states
- Attack Graph context
- Live World Map when real coordinates exist
- Active Campaigns
- AI Investigation Timeline
- Autonomous Analyst findings
- 18-source Threat Feeds & Detection Fabric
- connection probes for supported API/reference sources

## Autonomous Analyst behavior

The current analyst is deterministic and evidence-first. It correlates the latest observed security-fabric events by subject, CVE, indicator or host. It preserves source references, evidence states, evidence gaps, and proposed next actions.

The analyst does not:

- seed fake events or findings;
- claim exploitability without evidence;
- turn UNKNOWN or UNMEASURABLE into a positive state;
- execute containment because a source exists;
- mutate cases or endpoints without approval;
- claim live integration from repository code alone.

All proposed actions are APPROVAL_REQUIRED or NOT_EXECUTED.

## Connection truth

IMPLEMENTED means the connector code exists.

INTEGRATED means a real provider path responded successfully or real source evidence was received.

BLOCKED, UNKNOWN and UNMEASURABLE remain explicit when the environment cannot establish the requested condition.

Provider credentials belong in the deployment secret manager. Collector and scanner paths require external customer-side infrastructure. No provider credentials or synthetic telemetry are committed to the repository.
