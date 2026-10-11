# Security audit snapshot

**Date:** 2026-10-11
**Scope:** Angular/Vercel repository source and the available npm audit output. This is not a penetration test, production deployment review, or browser network capture.

## Findings

| Severity | Finding | Evidence and impact | State |
| --- | --- | --- | --- |
| HIGH | Angular production dependency advisories | `npm audit --omit=dev --audit-level=moderate` reports 10 production vulnerabilities (6 high, 4 moderate) across Angular 19 packages, including XSS, SSRF, and denial-of-service advisories. | Unresolved. Non-forced `npm audit fix` did not find a non-breaking remediation; npm proposed Angular 21. Schedule a tested Angular upgrade. |
| HIGH | Full dependency tree has known advisories | `npm audit fix` reports 49 total vulnerabilities: 2 critical, 30 high, 14 moderate, 3 low. Development tooling contributes additional findings. | Unresolved; full report should be regenerated after a compatible dependency update. |
| MEDIUM | Browser privacy boundary is not network-tested | Public processing code uses local libraries/workers, but no automated browser interception verifies actual requests during each workflow. | Unresolved evidence gap. Do not claim network-verified privacy. |
| MEDIUM | Third-party advertising/font traffic | Google AdSense and Google Fonts can make external requests and receive normal network/browser data. AdSense now has a configuration gate but is disabled in all checked-in environments. | Ads disabled by default; live consent, placement, policy, and data-flow checks remain required before enabling. |
| MEDIUM | Backend/API retains document-upload capability | The separately documented developer API accepts PDF uploads; API-key generation/deletion also contact the backend. | Intentional product surface, not a browser-tool fallback. Keep its server-side data handling distinct and reviewed. |
| LOW | CSP permits broad third-party sources and inline styles | `vercel.json` includes Google ad domains, broad HTTPS images, and `'unsafe-inline'` styles. CSP functionality has not been validated in a live deployment. | Existing policy retained; reduce sources and validate a nonce/hash strategy before tightening. |
| LOW | Legacy XSS header | Vercel config sends `X-XSS-Protection`, which is obsolete in modern browsers. | Remove after compatibility review; CSP remains the primary control. |

## Existing controls observed

- Vercel headers set `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, HSTS, Referrer-Policy, Permissions-Policy, and CSP.
- PDF tools enforce per-file and page limits; PDF.js rendering now includes per-page and aggregate pixel limits and releases canvases on success or failure.
- qpdf unlock transfers PDF bytes/password to a same-tab Web Worker, terminates the worker after a job, and uses a same-origin static WASM asset; no application upload fallback was found in this code path.
- PDF Tools Studio is implemented with pdf-lib/PDF.js services and does not inject `HttpClient`.
- Ads are gated by environment configuration and are disabled in local, development, and production settings in this snapshot.

## Required follow-up tests

1. Browser-level request interception for unlock, merge, split, image conversion, metadata editing, forms, and PDF.js operations; reject any request containing file bytes, filenames, or password values.
2. Malformed, oversized, encrypted, wrong-password, and high-page-count fixtures.
3. Production CSP evaluation against prerendered routes, workers, WASM, downloads, fonts, and any opt-in ad setup.
4. Review API authentication, key lifecycle, server upload buffering, logging, rate limits, and retention in the separate Flask repository before advertising or charging for the API.
5. Re-audit npm dependencies after the Angular upgrade.

See [data-flow.md](./data-flow.md), [privacy-claims-checklist.md](./privacy-claims-checklist.md), and [dependency-audit.md](./dependency-audit.md).
