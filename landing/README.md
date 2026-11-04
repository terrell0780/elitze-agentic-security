# Elitze landing page

Single-file, no build step, no trackers, no cookies. This replaces the "15 work areas" front door
with a page that answers three questions in one screen: *what is it*, *what does it cost*,
*why should I believe you*.

## What it contains

- Sticky minimal nav (Product · Pricing · Work · CTA)
- Hero: the actual problem ("your agents can take action — can you prove they were allowed to?")
- Three product jobs: investigate / validate / evidence (each one line, no feature dump)
- Fixed pricing: $500 / $1,500 / $2,500+ with delivery windows and Interac terms
- Proof section: ServiceDesk API + Elitze-Secure (both runnable)
- How-it-runs (3 steps), contact, and an authorization-boundary statement
- Footer keeps Docs/FAQ so the workspace is still reachable, but not in your face

## Deploy

### Option A — GitHub Pages (already live for preview)
```
https://terrell0780.github.io/elitze-landing/
```
Repo: `terrell0780/elitze-landing` (public), Pages from `main` / root.

### Option B — point elitze.info at it
1. In this repo: add a file named `CNAME` containing exactly `elitze.info`.
2. At your DNS provider, replace the current `elitze.info` records with:
   - `A  @  185.199.108.153`
   - `A  @  185.199.109.153`
   - `A  @  185.199.110.153`
   - `A  @  185.199.111.153`
   - `CNAME  www  terrell0780.github.io`
3. GitHub → Settings → Pages → set custom domain `elitze.info`, enable **Enforce HTTPS**.

### Option C — keep your current host
Upload `index.html` as the site root on whatever hosts elitze.info today (Vercel/Cloudflare/other).
Nothing else is required — the file is self-contained.

**Important:** the workspace app itself stays where it is. Point the "Open the workspace" button
(`/dashboard`) and footer Docs/FAQ links at your existing deployment paths, or edit those four
`href`s in `index.html`.

## Edit points (all in `index.html`)

| What | Where |
| --- | --- |
| Prices | `#pricing` cards |
| Workspace link | `<a class="btn ghost" href="https://elitze.info/dashboard">` |
| Email | every `mailto:terrell0780@gmail.com` |
| Proof links | `#work` section |
| Payment terms | hero `.facts` and `#pricing` note |

## Design notes

- Palette matches the workspace (violet/cyan on near-black) so the landing and app feel like one product.
- No stock photography, no fake logos, no testimonials, no "trusted by" strip — nothing that has to be
  walked back later.
- ~12 KB, no external requests, renders in one paint; readable at 360 px wide.
