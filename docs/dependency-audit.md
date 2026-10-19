# Dependency audit snapshot

**Date:** 2026-10-12
**Commands run:** `npm.cmd audit --omit=dev --audit-level=moderate`; `npm.cmd audit fix`.

## Results

- Latest production-only audit: **9 vulnerabilities** (6 high, 3 moderate), with Angular packages affected. `npm.cmd audit --omit=dev --audit-level=moderate` exits 1.
- Previous full-tree audit output: **49 vulnerabilities** (2 critical, 30 high, 14 moderate, 3 low), including development/build tooling. This full-tree count was not refreshed in the current audit.
- A non-forced `npm audit fix` was attempted. It did not remediate the Angular findings and recommended a breaking Angular 21 installation. No `--force` upgrade was performed.
- npm currently proposes `--force` to install Angular 21.2.25, a breaking major-version update. Do not force-upgrade blindly; choose a supported, peer-compatible Angular release, verify the full PDF test/build matrix, and then rerun the production and full-tree audits.

## Direct PDF dependencies

| Package | Version | Purpose | Declared license / concern |
| --- | --- | --- | --- |
| `pdf-lib` | 1.17.1 | Browser PDF page, image, metadata, and text-form operations | MIT; verify full dependency notices remain in the distributed app |
| `pdfjs-dist` | 4.10.38 | Browser PDF rendering and selectable-text extraction | Apache-2.0; large lazy bundle and worker asset; verify browser compatibility and upstream security updates |
| `@neslinesli93/qpdf-wasm` | 0.3.0 | qpdf WebAssembly unlock engine | qpdf is Apache-2.0; verify package/embedded dependency license notices and provenance before commercial promotion |

No Office conversion, OCR, local language model, PDF/A validator, digital signature engine, or secure redaction package has been added.
