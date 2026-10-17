# ELITZE Security Runner

The runner is the execution tier for live, authorized security validation. The ELITZE web application is the control plane; the runner executes the pinned scanner against explicitly authorized targets and sends signed observations back to the control plane.

## Cryptographic handshake and shared configuration

The control plane, runner, and GitHub Actions use different environment-variable names for the same HMAC key. The **secret value must be identical** in each location; never commit or print it.

| Location | Required key | Purpose |
| --- | --- | --- |
| ELITZE web application / Vercel | `ELITZE_SECURITY_RUNNER_URL` | HTTPS origin of the deployed runner |
| ELITZE web application / Vercel | `ELITZE_SECURITY_RUNNER_HMAC_SECRET` | Signs requests and verifies signed runner callbacks |
| ELITZE runner process | `ELITZE_RUNNER_HMAC_SECRET` | Verifies signed control-plane requests and signs callbacks |
| GitHub Actions repository secret | `ELITZE_RUNNER_URL` | Live runner origin checked by the production gate |
| GitHub Actions repository secret | `ELITZE_RUNNER_HMAC_SECRET` | Same HMAC key used by the control plane and runner |

`ELITZE_SECURITY_RUNNER_TOKEN` may be set on both the control plane and runner to add a bearer-token layer. If enabled, its value must match on both sides.

The production gate sends a fresh signed challenge with a random nonce to `/api/handshake`. It verifies the runner's response HMAC and requires the exact nonce to be returned. The runner rejects invalid signatures, stale timestamps, and replayed nonces. The integration self-test exercises successful verification, response-signature verification, replay rejection, and invalid-signature rejection against a real local runner process. That self-test is not evidence that a public production runner is deployed or reachable.

## Required runner configuration

- `ELITZE_RUNNER_HMAC_SECRET`: at least 32 UTF-8 bytes; must match `ELITZE_SECURITY_RUNNER_HMAC_SECRET` on the control plane and the `ELITZE_RUNNER_HMAC_SECRET` GitHub Actions secret.
- `ELITZE_CALLBACK_ORIGIN=https://www.elitze.info`: restricts callbacks to the canonical ELITZE production control plane.
- `ELITZE_RUNNER_ALLOWED_HOSTS`: comma-separated customer-owned hostnames explicitly authorized for testing. Keep empty until the approved targets are known; the runner refuses to start without at least one hostname.
- `ELITZE_RUNNER_ALLOW_PRIVATE_TARGETS=false`: blocks localhost, private, and link-local targets unless the runner is intentionally deployed inside an authorized private network.
- `ELITZE_SECURITY_RUNNER_TOKEN`: optional shared bearer token, configured identically on the runner and control plane if enabled.
- `ELITZE_RUNNER_UPDATE_TEMPLATES`: controls Nuclei template updates. Set according to the runner's controlled update policy.

## Scanner and execution

The runner image pins Nuclei v3.11.1 for reproducible builds. It does not accept arbitrary shell commands. It accepts signed job payloads, enforces the hostname allowlist and target safety checks, then invokes the fixed Nuclei engine.

## Reproducible scanner contents

The container pins Nuclei at `v3.11.1` and packages the templates repository at commit `17f5725dc10ced09f464dd2d255c19957aad51e7`. The runner reports this template revision from `/health` and in job results only while runtime template updates are disabled. Keep `ELITZE_RUNNER_UPDATE_TEMPLATES=false` for release verification; bump the pinned commit through review when updating templates. CI checks that the image contains and can enumerate the pinned HTTP misconfiguration templates.

## Railway deployment

1. Create a Railway service from the `terrell0780/elitze-agentic-security` repository and set **Root Directory** to `/runner`. Keep the service on a single replica because this implementation's job queue and handshake replay cache are process-local.
2. Generate a public HTTPS domain for that service. The host must be stable and reachable from Vercel and GitHub Actions. Set Railway's health check path to `/health`.
3. Set the following Railway service variables. Do not put secret values in repository files or build logs.

   | Variable | Value |
   | --- | --- |
   | `ELITZE_RUNNER_HMAC_SECRET` | The exact same secret value already used by Vercel `ELITZE_SECURITY_RUNNER_HMAC_SECRET` and GitHub Actions `ELITZE_RUNNER_HMAC_SECRET`. Keep it secret and at least 32 UTF-8 bytes. |
   | `ELITZE_CALLBACK_ORIGIN` | `https://elitze.info` |
   | `ELITZE_RUNNER_ALLOWED_HOSTS` | `www.elitze.info,elitze.info` for the ELITZE-owned web assets; add a customer hostname only with written authorization. |
   | `ELITZE_RUNNER_ALLOW_PRIVATE_TARGETS` | `false` |
   | `ELITZE_RUNNER_UPDATE_TEMPLATES` | `false` to retain the image-pinned template revision. |

4. Copy only the generated runner **origin** (no path, query or trailing slash) to Vercel production variable `ELITZE_SECURITY_RUNNER_URL` and GitHub Actions repository secret `ELITZE_RUNNER_URL`. Confirm that the HMAC secret values match exactly across all three locations. If `ELITZE_SECURITY_RUNNER_TOKEN` is enabled, configure the same token on Vercel and Railway too.
5. Verify the runner's public `/health` returns HTTP 200 and reports the expected template revision with `templateUpdatesEnabled: false`. Then rerun the GitHub production gates. A live pass requires a signed challenge-response with a fresh nonce, response HMAC verification, and nonce equality; missing secrets or a failed check must remain a release blocker.
6. After the handshake passes, run one separately authorized, low-impact validation through ELITZE and verify that the actual Nuclei engine completes and the control-plane callback is accepted. Do not interpret the handshake alone as proof that a scan or evidence callback worked.

## Deployment and acceptance criteria

Deploy the runner to an authorized container host that provides a stable HTTPS origin and can reach the intended targets. Configure the matching HMAC secret in the runner, Vercel, and GitHub Actions. Configure the actual runner origin in Vercel and GitHub Actions. Do not substitute a mock URL or test secret for production values.

Before calling the runner operational, verify all of the following:

1. The runner is deployed at the configured HTTPS origin.
2. `/health` returns HTTP 200.
3. The signed `/api/handshake` succeeds from the production gate and the response signature and nonce verify.
4. A separately authorized end-to-end scan completes through the actual Nuclei engine and returns observed evidence.
5. Callback signatures are accepted by the live ELITZE control plane.

The runner is designed to be customer-controlled so high-impact scanning can execute within an authorized network boundary. Passing local tests alone does not satisfy production acceptance.
