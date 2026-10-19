# Unclasp PDF tool completion report

**Snapshot:** 2026-10-12. The requested 33-item catalog matches the current intended inventory; the public UI exposes one PDF Tools Studio route, not 33 individual tool pages.

## Summary

- 17 tools have a real processing implementation (including the partial tools below) and unit-test coverage.
- 5 tools have a constrained/partial implementation: PDF to JPG, PDF Forms (text fields only), Compare PDF (selectable text only), PDF to Markdown (selectable text only), and Edit PDF (text overlays only).
- 2 tools have strict browser/output/network verification: Protect PDF and lossless Compress PDF.
- 14 tools are blocked pending an appropriate local engine and verifiable fixtures: Repair, OCR, Office/HTML conversions, PDF/A, cryptographic Sign, genuine Redact, AI summarization, and Translate.
- **Strict acceptance verified: 2/33 (Protect PDF and Compress PDF).** Both production-browser flows produced qpdf-validated output and manual request interception observed no document upload. The other 31 tools still need additional implementation or output/browser/privacy evidence.

The full per-tool evidence, source location, dependency, limits, and test caveats are in [tool-completion-matrix.json](./tool-completion-matrix.json).

## Validation evidence

| Command | Result | Scope |
| --- | --- | --- |
| `npm.cmd test -- --watch=false --browsers=ChromeHeadless` | **174 passed, 0 failed** | Full ChromeHeadless suite after the revenue-readiness changes. |
| `npm.cmd test -- --watch=false --browsers=ChromeHeadless --include=src/app/pdf-password-remover/engine/qpdf-unlock.spec.ts --include=src/app/pdf-password-remover/engine/pdf-compress.service.spec.ts --include=src/app/pdf-tools/pdf-tools.component.spec.ts` | 27 passed | qpdf helper, compression service, and PDF tools tests |
| `npm.cmd test -- --watch=false --browsers=ChromeHeadless --include=src/app/pdf-tools/pdf-tools.component.spec.ts` | **18 passed, 0 failed** | Isolated PDF tools component/service spec, including PDF.js text extraction |
| `npm.cmd run build -- --configuration production` | **Passed; 9 prerendered routes** | Latest audit build; includes current tool-page rendering; CommonJS and stylesheet deprecation warnings remain |
| `npm.cmd audit --omit=dev --audit-level=moderate` | Failed audit: 9 production vulnerabilities (6 high, 3 moderate) | Angular packages; npm proposes a breaking Angular 21 upgrade |
| `npm.cmd audit fix` | Did not remediate safely | npm proposed Angular 21 breaking upgrades; no force upgrade was taken |

The Protect PDF production-browser run generated a 1,670-byte output. A local qpdf verification rejected an incorrect password, accepted the correct password, decrypted the file, and reopened a one-page PDF. The Compress PDF production-browser run reduced a valid 30,800-byte PDF to 2,699 bytes. Request interception for both operations saw only same-origin GETs for worker bundles and qpdf WASM, with no document/password POST. Edit PDF was exercised in the production browser and PDF.js extracted its new text overlay. These browser checks are manual, not a repeatable E2E suite.

## Current browser/backend boundary

PDF-lib editing, PDF.js page rendering/text extraction, and qpdf unlock/protect/compress code are designed to run in the browser. The developer API and API-key operations remain backend-dependent and are separate from PDF Tools Studio. Protect PDF and Compress PDF have manual network traces; other operations have not been independently traced.

## Next work

1. Add repeatable browser tests that intercept requests and assert no document bytes, filenames, or passwords reach APIs or ad/analytics endpoints for each browser-only tool.
2. Resolve Angular advisories with a supported, peer-compatible update before promotion.
3. Select and validate local engines for one blocked class at a time. Do not add placeholder actions or remote fallbacks.
