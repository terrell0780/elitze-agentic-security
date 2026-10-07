# ELITZE Security Runner

This is the execution tier for live, authorized security validation. The ELITZE web application remains the control plane; the runner performs the actual scanner work and returns observed results.

## Engines

The first production engine is Nuclei v3.11.1. That version is pinned in the runner image. Nuclei v3.11.1 is pinned for reproducible runner builds.n649246search0

## Required configuration

`ELITZE_SECURITY_RUNNER_HMAC_SECRET` must match the control-plane secret.

`ELITZE_SECURITY_RUNNER_TOKEN` is optional and can add a bearer-token layer.

`ELITZE_CALLBACK_ORIGIN=https://elitze.info` restricts callbacks to the ELITZE production control plane.

`ELITZE_RUNNER_ALLOWED_HOSTS` is mandatory and should contain the customer-owned hostnames that the runner is authorized to test.

`ELITZE_RUNNER_ALLOW_PRIVATE_TARGETS=false` blocks localhost/RFC1918/link-local targets unless the runner is intentionally deployed inside an authorized private network.

## Start

Build and run the container, then point the ELITZE production environment at the runner with:

`ELITZE_SECURITY_RUNNER_URL=https://<runner-host>`

The web console supports manual execution, scheduled execution, Pentest and Red Team modes, live heartbeat/event updates, observed findings and evidence export.

The runner never accepts an arbitrary shell command. It only creates jobs from the signed ELITZE control-plane schema and invokes the fixed Nuclei engine against targets that pass the runner's explicit authorization allowlist.

## Operational model

ELITZE is designed for a customer-controlled runner. This keeps high-impact execution outside the web request path and lets security teams place the scanner where the target network and authorization boundary actually exist.
