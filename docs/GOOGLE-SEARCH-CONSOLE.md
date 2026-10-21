# Google Search Console — ELITZE Agentic Security

Canonical site: https://www.elitze.info

## Current crawl configuration

- `https://www.elitze.info/robots.txt` is the minimal three-line crawl policy; it does not serve as an access-control boundary. The public sitemap contains only public product/documentation routes. Sensitive workspace pages use `noindex` metadata and server-side authentication; API responses carry `X-Robots-Tag: noindex, nofollow, nosnippet`.
- `https://www.elitze.info/sitemap.xml` is the sitemap to submit to Google Search Console.
- The root route redirects anonymous visitors to `/login` and is therefore excluded from the sitemap. Crawler rules are not access controls; authentication and authorization must remain enforced server-side.
- Public page metadata should remain `index, follow`; do not add `noindex` to public pages.
- Canonical URLs must use `https://www.elitze.info` consistently. Keep `elitze.info` as the redirecting alternate if that is how the production domain is configured.
- `src/app/layout.tsx` already maps `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` to Next.js Google verification metadata. The value is evaluated at build/deploy time and is not fetched from Google automatically.

## Verification and token configuration — branch-first

**Keep related code and instructions on `fix/google-indexing-setup` until reviewed. Never put verification tokens, OAuth access tokens, or DNS credentials in source files, commits, issues, or pull-request comments. Do not change the Production environment as part of this branch task.**

Choose one Google verification method:

### Recommended: Domain property with DNS TXT

1. Sign in at https://search.google.com/search-console and choose **Add property** → **Domain**.
2. Enter `elitze.info` (no scheme and no path).
3. Copy the exact TXT record Google generates and add it in the `elitze.info` DNS zone in IONOS.
4. Wait for DNS propagation and click **Verify** in Search Console.

This method proves domain ownership through DNS and **does not require** `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`.

### Alternative: URL-prefix property with an HTML meta tag

1. Add the URL-prefix property `https://www.elitze.info/`.
2. Choose **HTML tag** verification and copy only the value inside Google's `content="..."` attribute. Do not use a guessed or manually generated value.
3. In Vercel, open project `elitze-agentic-security` → **Settings → Environment Variables**. Set `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION` in **Preview** and scope it to branch `fix/google-indexing-setup`, using the exact Google-provided value. Do not change Production.
4. A Preview deployment is required for this variable to be included in the rendered HTML. After the deployment is available, inspect its HTML for the Google verification meta tag and verify the property in Search Console.
5. Keep the token outside Git. Before merging, configure the corresponding Production environment value from Google's token through the deployment secret/settings workflow, then intentionally deploy the merged change. Do not copy token values into a PR.

## Submit the sitemap and request indexing

1. In Search Console, open **Sitemaps**, enter `sitemap.xml`, and submit.
2. Use **URL inspection** for `https://www.elitze.info/` and choose **Request indexing** if available.
3. Inspect `/platform` and `/security` after confirming each page is canonical and indexable.
4. Review **Page indexing** and **Sitemaps** reports for blocked URLs, redirects, canonical mismatches, and fetch errors. Recheck after Google recrawls.

## External discovery links

- Add a clear product link to the canonical URL in the project README and relevant GitHub repository description.
- Publish a truthful LinkedIn post that links to the canonical homepage.
- Consider relevant launch directories only when the listing is accurate and useful. Do not buy links or claim rankings, customers, certifications, or security outcomes that are not evidenced.

## Important limitations

Sitemap submission and indexing requests do not guarantee indexing or rankings. Search Console verification and submission require a user with access to the Google account; DNS verification also requires domain DNS access. Never commit verification tokens, access tokens, or DNS credentials to Git.
