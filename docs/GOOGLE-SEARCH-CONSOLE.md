# Google Search Console — ELITZE Agentic Security

Canonical site: https://www.elitze.info

## Current crawl configuration

- `https://www.elitze.info/robots.txt` should allow public documentation and product pages and disallow private workspace/auth/API paths.
- `https://www.elitze.info/sitemap.xml` is the sitemap submitted to Google Search Console.
- Public page metadata should remain `index, follow`; do not add `noindex` to public pages.
- Canonical URLs must use `https://www.elitze.info` consistently. Keep `elitze.info` as the redirecting alternate if that is how the production domain is configured.

## One-time Search Console steps (requires site-owner Google login)

1. Open https://search.google.com/search-console and choose **Add property** → **Domain**.
2. Enter `elitze.info` (no scheme and no path).
3. Copy the TXT record Google provides and add it to the `elitze.info` DNS zone in IONOS. Do not reuse a guessed verification token.
4. Wait for DNS propagation, then click **Verify** in Search Console.
5. Open **Sitemaps**, enter `sitemap.xml`, and submit.
6. Open **URL inspection**, inspect `https://www.elitze.info/`, then choose **Request indexing** if available. Repeat for `/platform` and `/security` after confirming each page is canonical and indexable.
7. Review **Page indexing** and **Sitemaps** reports for blocked URLs, redirects, canonical mismatches, and fetch errors. Recheck after Google recrawls.

## External discovery links

- Add a clear product link to the canonical URL in the project README and relevant GitHub repository description.
- Publish a truthful LinkedIn post that links to the canonical homepage.
- Consider relevant launch directories only when the listing is accurate and useful. Do not buy links or claim rankings, customers, certifications, or security outcomes that are not evidenced.

## Important limitations

Submitting a sitemap or requesting indexing does not guarantee indexing or rankings. Search Console verification and submission must be completed by a user with access to the domain DNS and Google account. Never commit verification tokens, access tokens, or DNS credentials to Git.
