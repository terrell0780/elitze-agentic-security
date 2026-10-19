# ELITZE Agentic Security — Modular Frontend Architecture

## Existing stack

This repository already uses Next.js App Router, React, TypeScript, Tailwind CSS, and server-side route handlers. Keep this stack; do not introduce a second Express server or duplicate frontend framework merely to split a large page.

## Boundaries

- `src/app/**/page.tsx`: route composition only; page-specific UI belongs in feature modules.
- `src/components/**`: reusable visual primitives and shared layout.
- `src/features/<feature>/**`: feature UI, types, and client controllers.
- `src/app/api/**/route.ts`: server-side API boundaries; authenticate, authorize, validate, and audit here.
- `src/lib/**`: shared server/client utilities, with server-only code kept out of client bundles.
- `src/app/globals.css`: global tokens, resets, and shared base rules.
- `src/features/<feature>/*.module.css`: feature-specific styles when Tailwind utilities are not sufficient.
- `scripts/**`: repeatable self-tests and release gates.

## Migration rules

1. Extract one coherent section or controller at a time and keep route files as composition layers.
2. Move data definitions beside the feature that consumes them.
3. Keep event handlers and state local to the owning client component; do not add inline script tags.
4. Keep authentication and tenant identity server-derived. Never trust client-supplied tenant identifiers.
5. Scanner/runner execution must validate authorized scope, require authenticated provider configuration, apply timeouts, and emit auditable results.
6. Distinguish implemented, configured, connected, and verified capabilities. Do not display synthetic security telemetry as real.
7. Preserve current routes and existing security self-tests during migration.

## Initial extraction

The home page's four-point control-model section is now a standalone component at `src/components/home/control-model-section.tsx`. The route imports and composes it. This is the pattern for subsequent extraction of navigation, endpoint integration, validation, and footer sections.

## Validation

Run the repository's established gates with its pinned Node version and lockfile:

```bash
npm ci
npm run typecheck
npm run lint
npm run test
npm run workspace-platform:self-test
npm run platform:readiness
npm run build
```

Do not promote a deployment until required checks pass.
