# Unclasp data-flow map

This describes the repository implementation; actual production traffic has not been captured.

## Public browser tools

| Data | Path | Server/third-party processing |
| --- | --- | --- |
| Selected unencrypted PDFs and images | File input → Angular component → pdf-lib in page thread or PDF.js worker → in-memory Blob/object URL → user download | No application processing API call is present in these code paths. Browser network verification remains outstanding. |
| Password and encrypted PDF for unlock | File input/password control → same-tab qpdf Web Worker → qpdf WASM downloaded from this site → returned bytes → download | No PDF/password upload fallback found in the unlock service. Production network interception has not been run. |
| Generated split/render downloads | In-memory Blob and object URL; links revoked on selection changes/component destruction, ordinary single downloads revoked after initiation | Not persisted by application storage code in the inspected paths. The browser/OS may retain downloads or crash artifacts outside app control. |
| PDF.js/qpdf engines | Static same-origin worker/WASM assets | The browser requests app assets; those requests do not include the selected file content by design. Verify in browser network tests. |

## Separate backend and third-party paths

- **Developer API:** User/API client sends a PDF and password to the configured Flask API over HTTPS for server processing. It is explicitly separate from the public local tools. API-key creation/deletion also contacts that service.
- **API key management:** The docs UI persists API key identifiers/labels in browser `localStorage`; the secret is shown once and should not be stored there. Avoid shared devices.
- **Hosting:** Vercel serves app/assets and can log standard request metadata under provider policy.
- **Fonts:** Current document links to Google Fonts; browser/IP and normal request headers go to Google.
- **Advertising:** AdSense publisher configuration exists, but the static script was replaced with an environment-gated loader and all checked-in environments currently disable it. If enabled, Google receives ordinary network/browser and ad-serving data; selected PDF bytes, file names, and passwords must not be included. Verify before enabling.
- **Analytics:** No analytics library was found in the inspected source search. This does not substitute for production network inspection.

## Retention caveat

The app does not promise control over browser-managed caches, downloads, operating-system backups, crash reports, hosting access logs, or provider retention. Do not describe the whole site as offline or as making no external requests.
