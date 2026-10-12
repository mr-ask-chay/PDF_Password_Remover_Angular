# Lighthouse performance investigation

## Scope and evidence

This review used the Angular 19 production build, esbuild output statistics and source maps, the rendered production app at `http://localhost:4000/`, and the existing tool-completion inventory. No Lighthouse CLI or package is installed in the project or available on `PATH`, so the supplied Lighthouse scores and throttled metrics could not be re-run here. Browser Performance API timings below are unthrottled local samples, not Lighthouse results.

## Findings and dispositions

| # | Finding | Root cause / evidence | Change and disposition |
|---|---|---|---|
| 1 | Network dependency tree | Production already uses script/style/font optimizations, prerendering, hydration, route-level lazy loading and deferred loading for the password-remover demo. The shared initial JavaScript contains required Angular core and RxJS modules; Zone.js is an Angular polyfill. No unnecessary blocking script or useful preconnect candidate was found. The app shell also injected its web manifest from a timer after `load`. | The manifest is now declared directly in `src/index.html`; its delayed timer and event listener were removed. This removes avoidable post-load JavaScript work, but does not eliminate required Angular startup dependencies. |
| 2 | Oversized portrait | The portrait was a 400 × 545, 14,164-byte WebP shown below the fold. | Added a 336 × 458 WebP (9,592 bytes) and a `srcset`/`sizes` pair while keeping the 400px source as fallback. The smaller candidate saves 4,572 bytes (about 32%) versus the previous image. Production browser verification selected the 336px candidate at a 390px viewport. |
| 3 | DOM size | The supplied count (203 elements, depth 11, 12 maximum children) does not establish excessive DOM cost. The local production page measured 244 elements, depth 12, and earlier 40 maximum children; the variation reinforces that the count is not a reason by itself to remove semantic content. | No markup was removed. The existing content and accessible structure are preserved; a profile demonstrating a costly subtree would be needed to justify simplification. |
| 4 | LCP element render delay | The reported paragraph is ordinary hero text present in prerendered HTML. It is not hidden behind an animation or deferred component. Local browser samples also identified that paragraph as LCP, but they do not reproduce the reported 380ms render delay under Lighthouse throttling. | No speculative CSS or visibility workaround was applied. The delay remains unverified and needs a comparable Lighthouse run to identify whether the deployment, network, styles, or browser execution is responsible. |
| 5 | Main-thread work | Source maps show the large shared startup chunk consists primarily of Angular core and RxJS. The PDF libraries are in route-specific chunks; the password-remover demo is viewport-deferred. The app also had the redundant delayed manifest injection. | Removed the timer-based manifest injection. No safe evidence supports removing hydration, Zone.js, or required framework startup work. The supplied 3.0s Lighthouse breakdown was not remeasured. |
| 6 | Unused CSS | Global styles already use selective Bootstrap Sass imports and remove a set of utility families before generating the utilities API. Bootstrap component and utility rules are shared across routes and tool UIs; a single homepage coverage sample cannot establish that they are unused across the application. | No CSS purge or component removal was made. The reported CSS savings remain unverified against all routes and dynamic states; a production coverage run across the tool pages is needed before pruning shared rules. |
| 7 | Long main-thread tasks | The source-mapped shared chunk corresponding to the reported large common bundle contains Angular core and RxJS, which are needed for the hydrated Angular app. PDF libraries are split into route-specific chunks. No profiling trace was available to attribute the reported main-document tasks to avoidable application code. | Existing route/defer boundaries were preserved. No unsupported worker or extra split was introduced. The eight long tasks and their duration remain unverified without a comparable trace. |
| 8 | User Timing instrumentation | Zone.js is configured as Angular's runtime polyfill. The supplied Zone marks/measures are framework instrumentation; no custom high-volume timing instrumentation was found. | No Zone.js or Angular instrumentation was disabled. This is not treated as a performance defect. |

## Browser verification

The production build was served locally and checked at a 390 × 844 viewport. The homepage, About, PDF tools, password-remover, and docs routes rendered. The password-remover page exposed its PDF selector, password input, and remove action; an actual unlock was not run because no test PDF/password fixture was supplied. The portrait's selected URL was `me-336.webp`; the static manifest link was present. CLS was 0 in the post-change browser sample.

| Local browser sample | Before | After |
|---|---:|---:|
| TTFB | 15 ms | 9 ms |
| DOMContentLoaded | 496 ms | 335 ms |
| Load event | 516 ms | 352 ms |
| First Contentful Paint | 176 ms | 232 ms |
| Largest Contentful Paint | 176 ms | 232 ms |
| CLS | 0 | 0 |
| DOM elements | 244 | 244 |

These are local browser API samples, not Lighthouse scores, and should not be interpreted as a controlled performance comparison: there was no Lighthouse device/network throttling, and individual paint values varied between runs. In particular, the local LCP sample increased; the source changes therefore do not establish that the reported LCP render delay or main-thread findings are fixed. Lighthouse Performance score, TBT, Speed Index, unused CSS, the dependency-tree latency and long-task count are unavailable rather than inferred.

## Tool inventory and validation

The repository's `docs/tool-completion-matrix.json` has 33 catalog entries, but its completion report marks 14 as blocked with evidence; this review does not claim all 33 are functional. No tool registrations or PDF processing dependencies were removed.

Validation performed:

- `npm.cmd run build` — passed (existing Sass deprecation, Bootstrap selector, CommonJS, and component-style budget warnings remain).
- `npm.cmd test -- --watch=false --browsers=ChromeHeadless` — 174 tests passed.
- `npm.cmd run check:seo` — passed for 8 prerendered indexable routes.
- Production browser smoke check — homepage, About, PDF tools, password-remover and docs routes rendered; password-remover controls were present.
- No lint script or Lighthouse CLI/package is configured in this repository.
