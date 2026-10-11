# Technical and brand SEO audit

**Updated:** 2026-10-11
**Production domain in repository:** `https://pdf-fe-kappa.vercel.app`

## Reports reviewed

The two supplied PDFs are snapshots from 2026-10-11 of the earlier production site. The home-page report scored on-page SEO 89/100 and flagged keyword density, low text-to-HTML ratio, and a wide meta description. The full-site report highlighted measured LCP/load times, unused JavaScript, one API Docs contrast issue, invalid ARIA, missing skip navigation, and missing `llms.txt`/FAQ markup. Its crawl analyzed five pages and cannot establish current build or hosting behavior.

## Changes made in the current app

- Updated route titles and descriptions to describe actual PDF functions and distinguish local website tools from the server-side developer API.
- Added a keyboard skip link and a single global main landmark; replaced API Docs' nested main landmark with a neutral container.
- Added explicit image dimensions and lazy decoding/loading to below-the-fold homepage images.
- Kept visible keyboard focus while making its outline detectable by accessibility checks.
- Darkened API method badges to improve text contrast and removed the incomplete tablist role from a group of buttons.
- Added route-specific FAQ JSON-LD on the homepage only; it is removed when navigation leaves that route. The FAQ content is also visible on the page.
- Added `llms.txt` with factual tool capabilities, limitations, and links; exposed it as a root build asset.
- Added footer links to the author/about section and PDF Tools Studio.

## Current routes and indexing

- Indexable routes: home, PDF unlock, PDF tools, API docs, privacy, and terms.
- The coming-soon image page and wildcard 404 are noindex and have no canonical.
- `src/sitemap.xml` lists the six canonical routes; `src/robots.txt` links to it.
- The application uses prerendering and route-aware title, description, robots, canonical, Open Graph, and Twitter metadata.
- The catalog intentionally does not create 33 thin pages for tools that are unavailable or only partially implemented.

## Still requires deployed measurement or external access

- LCP, Core Web Vitals, response time, compression, HTTP protocol support, and bundle impact are deployment/browser measurements. The reports' performance numbers are from an older snapshot; no post-change Lighthouse run has been performed.
- The text-to-HTML ratio can be affected by Angular's prerendered/hydration markup. Do not add keyword-stuffed copy to inflate it; assess the current deployed HTML and search usefulness instead.
- Validate generated route HTML, FAQ JSON-LD, redirects, link targets, mobile layout, contrast, and screen-reader behavior against the deployed build before release.
- Search Console/Bing access is unavailable here. Sitemap submission, indexing/canonical selection, impressions, CTR, and ranking cannot be verified from source code.
- FAQ structured data is descriptive markup, not a promise of Google FAQ rich results or ranking gains.
