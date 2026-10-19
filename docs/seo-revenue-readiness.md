# Unclasp SEO revenue readiness

**Audit date:** 2026-10-12\
**Configured origin:** `https://pdf-fe-kappa.vercel.app`\
**Conclusion:** The local application has a credible technical SEO base and server prerendering, but the live deployment was stale during this audit and search performance cannot be verified. The repository has one main PDF Tools Studio page, not 33 distinct indexable PDF tool pages.

## Route inventory

| Route | Indexing | Metadata/content evidence | Sitemap |
| --- | --- | --- | --- |
| `/` | Index, follow | Unique route title/description; branded homepage, product description, FAQs and internal links | Included |
| `/about` | Index, follow | Author/product notes; author/testing context | Included locally; live returned 404 at audit time |
| `/contact` | Index, follow | Contact and support route | Included locally; live returned 404 at audit time |
| `/docs` | Index, follow | Developer API docs, HMAC examples, quota and server-upload context | Included |
| `/pdf-password-remover` | Index, follow | Actual local workflow, limitations, instructions, FAQ and privacy/API distinction | Included |
| `/pdf-tools` | Index, follow | Single route with 10 visible areas: merge, compression, split, JPG/PNG-to-PDF, PDF-to-JPG, Markdown, text comparison, page operations, text fields, protection | Included |
| `/privacy` | Index, follow | Browser/API distinction, storage, hosting, third parties, advertising disclosure | Included |
| `/terms` | Index, follow | Terms for public tools/API | Included |
| `/image/select-image` | Noindex, follow | Coming-soon placeholder only | Excluded |
| Wildcard 404 | Noindex, follow | Not-found component | Excluded |

Descriptions and route titles live in `src/app/app.routes.ts`. `SeoTitleStrategy` updates title, description, robots, canonical, Open Graph, Twitter, and optional FAQ schema during rendering/navigation. The global document (`src/index.html`) also contains organization/site/application structured data and search/social declarations. Route output, not source declaration alone, is now tested.

### The “33 tool pages” claim

The repository inventory contains 33 *named tool ideas*, but the router exposes no per-tool routes. There are 10 UI cards/operation areas in the Tools Studio. Some cards combine operations (for example, page operations and image conversion), and 14 inventory entries have no implementation at all. Do not create or index 33 unique landing pages until each page genuinely offers that tool, meaningful instructions and limitations, and a tested complete workflow. Thin/placeholder pages risk disappointing users and misleading search engines.

## Crawl/render/sitemap checks

- Production Angular builder has `prerender: true`; `src/server.ts` provides the SSR application and compression middleware. A production build in this task successfully prerendered nine static routes (eight intended indexable routes plus the nonindexable placeholder).
- `src/robots.txt` allows crawling and references the configured production sitemap. `src/sitemap.xml` currently lists the eight intended indexable URLs. `vercel.json` includes a redirect from `/assets/sitemap.xml` to `/sitemap.xml`.
- The route title strategy removes canonical links for noindex routes and excludes query strings/fragments from canonical URLs.
- **Fixed in this audit:** the Tools Studio component had been deferred until explicit user interaction, so prerender contained its title but not the actual catalog/workflow. It is now rendered directly. The page test confirms all ten cards appear without a load button; the built output check requires their headings.
- **Local build regression check:** `npm.cmd run check:seo` checks the eight generated indexable pages for nonempty unique title and description, `index, follow`, one correct canonical, a visible H1, route/sitemap membership and `robots.txt` sitemap URL. It verifies the image placeholder remains `noindex, follow` without a canonical or sitemap entry. It also confirms the 10 PDF tool headings appear in prerendered `/pdf-tools`.
- Images in the homepage have explicit dimensions/responsive alternatives/lazy decoding where appropriate according to local source/docs. The site uses responsive Bootstrap classes and status/live regions on tool actions; automated full WCAG/mobile usability certification is not present.

## Live/deployment observations

Read-only HTTP checks on the configured public origin during this audit:

- `https://pdf-fe-kappa.vercel.app/ads.txt` returned `google.com, pub-7945845389175063, DIRECT, f08c47fec0942fa0`.
- `/robots.txt` and `/pdf-tools` were reachable.
- `/about` and `/contact` returned HTTP 404.
- Live `/sitemap.xml` listed six older routes, omitting About and Contact, whereas the local repository sitemap lists eight. The public deployment therefore did not match local audited source at the time of check. No deployment was made by this task.
- Live HTML fetch is not a substitute for a full browser crawl, response-header/CSP test, rendering of all interactions, or Google/Bing indexing report.

## SEO readiness by topic

| Topic | Result | Notes / remaining action |
| --- | --- | --- |
| Unique metadata | **IMPLEMENTED; local output check passes** | Eight indexable route title/description pairs validated from built HTML. Rerun `npm.cmd run check:seo` after route/content changes. |
| Canonicals | **IMPLEMENTED; local output check passes** | Correct configured site origin and path; noindex routes remove canonical. Verify canonical selection in live Google/Bing after deploy. |
| Sitemap/robots | **Local source correct; deployment mismatch observed** | Submit the updated sitemap only after deployment and verify exact URLs/HTTP status. |
| Discoverable functionality | **Improved and locally verified** | Actual supported tool cards now appear in prerender, not behind a click-to-load placeholder. |
| 33 tool page coverage | **MISSING** | No 33 routes. Only accurate routes for genuinely implemented operations should be considered. The detailed capability/test matrix is `tool-completion-matrix.json`. |
| Structured data | **IMPLEMENTED BUT NOT VERIFIED** | Organization, Person, WebSite, WebApplication, and home FAQ JSON-LD are present. Validate output with current Google/Bing tools; schema does not guarantee rich results or ranking. |
| Internal links | **IMPLEMENTED** | Home/header/footer link to priority routes. Continue cross-linking only relevant help/tools; the homepage/project is not a general PDF product suite. |
| Accessibility/mobile | **PARTIAL** | Existing skip link, labels, keyboard focus, live status, and responsive layout are positive source evidence. No current device lab, screen-reader, Lighthouse, or WCAG audit was run. |
| Performance/Core Web Vitals | **NOT VERIFIED** | Production build passed. No current Lighthouse, field Core Web Vitals, deployed latency, LCP/CLS/INP, or mobile connection measurement is available. |
| Broken links/routing | **DEPLOYMENT ISSUE OBSERVED** | Live About and Contact 404. Run a production crawler/link check after the authorized deployment. Local output verifies prerender, not host rewrites. |
| Search demand and ranking | **NOT VERIFIED** | No Search Console/Bing account/data, query impressions, clicks, rank or organic traffic evidence. Do not make ranking or visitor claims. |

## Webmaster and release steps

1. After owner-authorized deploy, check the live configured domain and redirects; ensure `/about`, `/contact`, all sitemap URLs and static legal/tool pages return the expected success status and HTML.
2. Verify property ownership in [Google Search Console](https://search.google.com/search-console/) and [Bing Webmaster Tools](https://www.bing.com/webmasters/). The repository has Google verification artifacts, but account ownership and platform confirmation cannot be verified here.
3. Submit `https://pdf-fe-kappa.vercel.app/sitemap.xml` in both webmaster platforms; inspect crawl errors, selected canonical, noindex, page indexing and resource blocking.
4. Test the built/deployed routes on mobile and desktop with keyboard/screen-reader checks and current Lighthouse/PageSpeed. Compare lab results and Search Console field data rather than assuming build output represents real-user metrics.
5. Check links after deployment and re-run `npm.cmd run check:seo`; investigate if live HTML differs from generated route HTML.
6. Measure organic impressions and clicks in webmaster tools. Do not add analytics carrying document data; any separate completion analytics requires an explicit privacy/consent review.

## Implemented regression command

```powershell
npm.cmd run build -- --configuration production
npm.cmd run check:seo
```

Latest recorded check: production build succeeded and prerendered 9 static routes; `check:seo` passed for all eight indexable routes and the noindex placeholder. This is local technical verification only; live crawl/index status remains unverified.
