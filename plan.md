# ELITZE public experience and security workspace

## Product scope

Turn the current redirect-only home route into a professional public landing page that explains ELITZE as an agentic security control plane, then hands visitors into the existing authenticated workspace. Preserve the evidence-first promise: no synthetic incidents, no invented telemetry, and no unverified state presented as live protection.

## Design direction

- **Style options:** Precision noir / 0.06; Editorial trust / 0.04; Soft enterprise / 0.03.
- **Chosen movement:** Precision noir, combining premium security-operations interfaces with restrained editorial SaaS storytelling.
- **Core principles:** make the control loop legible; show proof instead of hype; create one clear CTA path; use generous hierarchy around dense security concepts.
- **Color philosophy:** deep ink surfaces communicate controlled infrastructure; cyan is the signature action/evidence color; emerald means verified; amber means review or incomplete evidence.
- **Layout paradigm:** asymmetrical split hero with a product preview, then wide narrative sections and compact capability cards; the authenticated product remains a left-navigation operations workspace.
- **Signature elements:** evidence status pills, connected-path diagrams, and thin cyan signal lines used as accents rather than decoration.
- **Interaction philosophy:** every public CTA leads to a concrete next step; dashboard links preserve a clear operating sequence from discovery to proof.
- **Animation:** restrained hover lift and glow only; no visual animation should imply live incidents or telemetry.
- **Typography:** compact sans-serif hierarchy with strong tracking control, readable body copy, and monospaced evidence/status values.
- **Brand essence:** security for the agentic enterprise, helping security teams control what AI agents can reach and do, with proof they can verify. Personality: precise, accountable, calm.
- **Brand voice:** direct and evidence-led. Example lines: “Security for the agentic enterprise.” and “No record. No claim. No synthetic telemetry.”
- **Wordmark/mark:** ELITZE wordmark paired with a shield-check mark that represents governed action and verified outcome.
- **Signature brand color:** cyan `#a5f3fc` / `#67e8f9` against ink `#071018`.

## Implementation approach

- Public `/` is server-rendered, indexable, and contains the landing page, product preview, control loop, platform capabilities, security principles, role-specific paths, and CTA to `/register`.
- Authenticated `/workspace` remains the guarded entry point and redirects signed-in users to `/console`.
- Existing `/console` and nested console pages remain the dashboard information architecture. The shared `SecurityWorkbenchSidebar` provides persistent navigation across command center, analyst, threat detection, adversary emulation, vulnerability intelligence, readiness, governance, value, and security model pages.
- Keep the dashboard data-driven and honest: live APIs determine status; empty or missing data remains explicitly unverified.
- Add `public/manus-routes.json` with the complete route manifest and keep `robots.ts` disallow rules for authenticated and API paths.

## Project structure

- `src/app/page.tsx`: public landing page.
- `src/components/home/site-header.tsx`: public navigation and workspace CTAs.
- `src/components/home/site-footer.tsx`: public legal/contact navigation.
- `src/app/console/page.tsx`: authenticated command center.
- `src/app/console/*/page.tsx`: authenticated specialist dashboard pages.
- `src/components/security-workbench-sidebar.tsx`: shared authenticated multi-page navigation.
- `src/app/globals.css`: shared theme, accessibility focus, and reduced-motion rules.
- `public/manus-routes.json`: route declarations for Preview tooling.
