# ELITZE public experience and dashboard TODO

## Public landing page

- [x] The `/` route is a professional public landing page rather than an automatic redirect to login.
  - It must explain ELITZE as an agentic security control plane.
  - It must include a clear primary CTA to create a workspace and a secondary CTA to explore the platform.
  - It must show the control path from discovery through evidence-backed retesting.
  - It must include capability, security-principle, and role-specific sections.
  - It must not represent illustrative UI as live tenant telemetry.
- [x] Confirm public navigation exposes the landing-page sections and points to public product pages without exposing authenticated tenant state.
- [x] Confirm landing page is responsive at desktop and mobile widths through responsive layout classes and mobile navigation.
- [x] Replace the plain sign-in form with a branded cybersecurity workspace handoff.

## Authenticated dashboard

- [x] `/workspace` remains the guarded entry point and sends unauthenticated visitors to `/login`.
- [x] `/console` is the authenticated command center.
- [x] Keep the command center focused: summary metrics and dedicated links replace the overloaded all-capabilities atlas.
- [x] Existing specialist routes remain available as separate dashboard pages: analyst, threat detection, adversary emulation, vulnerabilities, readiness, skills, integrations, ROI, and governance.
- [x] Improve the shared dashboard navigation labels and active-state clarity where needed after visual review.
- [x] Remove unrelated advertising governance from the visible cybersecurity navigation.
- [ ] Keep live status claims tied to API evidence and preserve explicit unverified/empty states.

## Runtime and delivery

- [x] Add and verify `public/manus-routes.json` for all source page routes.
- [x] Run TypeScript diagnostics.
- [x] Run the production build.
- [x] Commit and push the completed implementation to the canonical `main` branch.
