# Monetization plan

**Readiness: NOT READY for production monetization.** No payment provider, business/tax details, ad-placement approval, or live consent verification is available in this repository.

| Channel | Current state and prerequisite | Cost/privacy/user impact |
| --- | --- | --- |
| Contextual advertising | Existing publisher ID is retained. AdSense loader is configuration-gated; all checked-in environments set `enableAds: false`. Enable only after safe placement, consent, publisher-policy, CSP, and network checks. | Provider approval and potentially consent tooling. Google may receive browser/IP/ad data; never send file-derived data. Ads can harm trust if they obscure processing. |
| Premium local convenience | No paid tier. Candidate: optional saved presets or additional batch convenience, after clearing storage/privacy design and testing. | No server required; local storage could expose user preferences. Keep free core workflows usable. |
| Payment/subscription | Not implemented. | Requires a provider, credentials, tax/legal choices, fees, webhook verification, and customer-support process. Do not add a fake checkout. |
| Affiliates | Not implemented; no useful verified product recommendation has been selected. | Requires disclosure and relevant, non-misleading products. |
| Developer API | Existing separate backend-dependent API is documented. Not ready to promote/charge from this frontend audit. | Requires backend security, quotas, cost/abuse controls, retention review, and operating cost data. Uploads are server-side. |

Measure only aggregate, non-document events if analytics is later considered; never collect filenames, content, passwords, metadata, or document-derived IDs. No traffic, ad RPM, conversion, demand, or revenue figures were verified; no earnings are forecast.

## Ads rollout gate

1. Confirm AdSense account/publisher approval and applicable consent rules.
2. Add explicit, visually distinct ad slots outside upload, processing, result, and download controls.
3. Confirm Auto Ads cannot inject placements into sensitive workflows.
4. Test disabled, blocked, failed, and enabled configurations; validate CSP and actual third-party data flows.
5. Only then change the production `enableAds` flag and update the privacy disclosure.
