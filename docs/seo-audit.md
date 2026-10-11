# Technical and brand SEO audit

**Date:** 2026-10-11
**Production domain in repository:** `https://pdf-fe-kappa.vercel.app`

## Current findings and changes

- The Angular router has indexable home, PDF unlock, PDF tools, API docs, privacy, and terms routes; the placeholder image route and wildcard 404 are marked noindex.
- The sitemap lists six canonical URLs and `robots.txt` points to it.
- The Angular production build prerendered 7 routes in the last verified build. That build preceded the latest changes; rerun it before release.
- Vercel deployment declares a trailing-slash policy and security headers; live redirect/status behavior was not checked.
- The homepage now names Unclasp in its H1 and explains local supported processing versus the separate server API. Homepage route metadata was updated to reflect that boundary.
- Open Graph, Twitter, organization/site/application JSON-LD and favicon/manifest metadata are present. Schema and live social-preview output have not been independently validated.
- The sitemap has only six URLs. The catalog does not currently have 33 individual indexable pages; avoid generating thin or unsupported tool pages.

## Remaining checks and opportunities

- Verify canonical tags, response status, redirects, prerendered route content, broken links, mobile layout, Core Web Vitals, and accessibility in a deployed build.
- Validate JSON-LD with a current structured-data validator before making claims about rich results.
- Search Console and Bing Webmaster access are not available here. Submit the sitemap and inspect indexing, canonical selection, and brand-query impressions there.
- Track impressions, clicks, CTR, indexed pages, and the exact brand query “Unclasp” in the search-console tools. Do not claim a rank improvement without their data.
- Build unique tool landing pages only for implemented, supportable tools, with usage instructions, limits, and privacy details. The current single PDF Tools route is more accurate than 33 placeholder pages.
- Performance evidence is limited to the last build’s bundle report (initial browser bundle ~796 KB raw, PDF.js is lazy-loaded). No Lighthouse/Core Web Vitals run was performed.
