# Privacy claims checklist

Claims must be tied to current code and tests. Last reviewed 2026-10-11.

| Claim | Evidence | Status |
| --- | --- | --- |
| Core PDF processing code is browser-local | pdf-lib service, PDF.js renderer, and qpdf unlock service/worker | Source inspected; runtime network behavior not verified |
| Public tools have no silent processing upload fallback | No server fallback in inspected processing services | Source inspected; browser request assertions not implemented |
| The separate developer API uploads files to a backend | API docs/service and privacy policy describe server-side upload | Verified from source/docs; backend retention policy still requires operational review |
| The app does not store selected PDFs/passwords in localStorage or IndexedDB | No such persistence in the inspected public tool paths | Source inspected, not browser instrumentation |
| Ad requests are not required for local builds | `enableAds: false` in checked-in environment files; dynamic loader test | Unit test; current change needs full-suite rerun |
| No third-party requests occur | **Do not claim.** Fonts are remotely loaded; Vercel assets and potential ads/API calls are external | False |
| Downloads and crash artifacts are erased by Clear/Reset | No global clear feature; browser/OS are outside app control | **Do not claim.** |
| Browser-only processing has been proven by network interception | No Playwright/Cypress/network interception suite is configured or run | **Not verified.** |

Before enabling ads or publishing a stronger privacy claim, add browser automation that monitors requests and inspects request bodies/headers while running representative tools, including wrong-password and malformed-PDF failures.
