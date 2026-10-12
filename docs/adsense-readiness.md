# AdSense readiness review

## Current status

The repository includes an AdSense publisher configuration in `src/index.html` and a loader service that is explicitly gated behind a configuration flag. The current checked-in code is not set to enable live AdSense delivery by default.

## What exists in code

- AdSense meta configuration is present in `src/index.html`.
- The loader logic is controlled through the app configuration layer and service (`src/app/core/service/adsense-loader.service.ts`).
- The site privacy policy includes a description of AdSense and its limits.
- There are no live ad slots in the global header, footer, or file-processing controls in the current implementation.

## Placement decisions

These placements are considered non-compliant or unsafe for the current app flow:

- header and navigation areas
- drag-and-drop upload blocks
- processing controls, download buttons, or confirmation actions
- pages with minimal or thin content
- ad units placed adjacent to primary file controls

The application therefore keeps ad delivery disabled unless a future deployment explicitly enables and validates it under policy and consent requirements.

## Policy and approval notes

This codebase can be considered configuration-ready but not ad-account-approved. Google approval, live account status, consent tooling in EEA/UK/CH traffic, and final publisher compliance remain external to source control.

## Evidence-based conclusion

The repo is prepared for an AdSense review in the sense that it avoids unsafe ad placement, keeps advertising logic separate from PDF processing, and documents the privacy/compliance boundary. Actual approval and live traffic behavior are not guaranteed by code alone.
