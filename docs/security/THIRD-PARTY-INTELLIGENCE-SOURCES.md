# Third-party intelligence sources

ELITZE pulls vulnerability intelligence from primary feeds. It does **not** ingest
scraped third-party datasets.

## Live sources (implemented)

| Source | Use | License / terms |
| --- | --- | --- |
| NVD REST 2.0 (`services.nvd.nist.gov`) | CVE keyword search | Public; optional `NVD_API_KEY` |
| CISA KEV catalog | Known-exploited list | Public domain (U.S. Government) |
| FIRST EPSS (`api.first.org`) | Exploit-likelihood score | Public API |
| OSV.dev (`api.osv.dev`) | Package / advisory ID lookup | OSV data is CC-BY 4.0; attribution required |
| GitHub Advisory Database (`api.github.com/advisories`) | GHSA / keyword | CC-BY 4.0; attribution required |

Optional env: `NVD_API_KEY`, `GITHUB_TOKEN` (or `GH_TOKEN`) raise rate limits. They are not required.

## Not used, and why

`huggingface.co/datasets/Vyber07/cyber-security` is **not** an approved source.

- Discussion #8: copyright-infringement report (identical SHA256 to
  Voidreaper2026/cybersec-master-dataset, attribution stripped).
- The repo `LICENSE` file prohibits commercial use and claims ownership of the
  copied work, contradicting the card's "Apache 2.0".
- Upstream CC-BY 4.0 / CC-BY-SA 4.0 notices were removed.
- ARVO source tars (`arvo__*__repo-vul.tar.gz`) have separate provenance.

Do not ingest, rebrand, or fine-tune on this dataset in ELITZE. If a knowledge
corpus is needed later, use the primary feeds above, or the original
Voidreaper2026 Apache-2.0 dataset **with attribution** and a curation pass that
keeps methodology and drops exploit cookbooks.

Framework names (MITRE ATT&CK, OWASP, NIST, CIS, D3FEND, ATLAS) are reference
mappings only. They are not product branding and grant no execution authority.
