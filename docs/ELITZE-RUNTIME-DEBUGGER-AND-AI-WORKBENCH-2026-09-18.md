# ELITZE Agentic Security — Runtime Debugger and AI Workbench

## Implemented

The ELITZE workbench now includes an authenticated, inspector-backed runtime debugger for authorized Node JavaScript/TypeScript workloads.

Capabilities:
- line, conditional, logpoint and temporary breakpoints
- step over, step into, step out
- run to location
- frame-scoped expression evaluation
- watches and runtime scope variables
- runtime stdout/stderr and exception observation
- debugger-session/event evidence in PostgreSQL when available
- AI investigation based only on captured debugger state

## JetBrains capability mapping

ELITZE implements capability equivalents rather than copying JetBrains source or proprietary assets.

- Stepping and run-to-location map to the IntelliJ debugger flow.
- Arbitrary expression evaluation maps to frame-scoped runtime evaluation.
- Watches and variables map to runtime scope inspection.
- Non-suspending logpoints are represented by ELITZE expression logpoints.
- Agentic debugging is represented by the ELITZE Debug Investigator, which turns runtime evidence into concrete debugger actions.

Reference material:
- https://www.jetbrains.com/help/idea/stepping-through-the-program.html
- https://www.jetbrains.com/help/idea/examining-suspended-program.html
- https://www.jetbrains.com/help/idea/logpoints.html
- https://blog.jetbrains.com/idea/2026/08/agent-skills-in-intellij-idea/

## ELITZE boundary

Every debugger request requires the existing ELITZE team session. Runtime targets are confined to the workspace and are launched directly with Node rather than through shell interpolation.

Expression evaluation is read-only by default. Side-effecting evaluation requires ELITZE_DEBUGGER_ALLOW_SIDE_EFFECTS=true.

Production runtime debugging must be enabled explicitly with ELITZE_DEBUGGER_ENABLED=true.

The runtime debugger keeps session state in the Node process. A stateless serverless deployment must not be represented as providing durable interactive sessions until a dedicated long-lived debugger worker is attached.

No synthetic runtime evidence is generated.
