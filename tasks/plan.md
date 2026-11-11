# Implementation Plan: BZaudio GitHub-only Release 1

## Status
Architecture and implementation plan approved by the user on 2026-11-10. The project was migrated to `BZaudio-company`, which the user explicitly authorized to make public on 2026-11-10. Use short-lived feature branches for follow-up changes. No merge to `main` or production deployment without separate approval.

## Overview
Deliver the BZaudio static live-sound toolbox using React, TypeScript, Vite, browser audio APIs, GitHub Pages, and GitHub Actions. Work is organized into small vertical slices with explicit checkpoints.

## Architecture decisions
1. **Static hosting:** GitHub Pages serves the built frontend; there is no application server.
2. **Build/deploy:** GitHub Actions performs CI and Pages deployment. Production deployment is gated and uses least-privilege workflow permissions.
3. **Frontend:** React + TypeScript + Vite; configure the repository base path correctly for project Pages.
4. **Audio engine:** Browser Web Audio API; keep calculations and DSP primitives independently testable.
5. **Admin:** No custom privileged admin backend. Public admin landing page links to GitHub. Actual privileges are controlled by GitHub repository permissions and workflow access.
6. **Persistence:** Browser-local non-sensitive preferences/workspaces only; no cross-device sync or customer accounts.
7. **Domain:** No custom domain until user provides a registered domain and confirms DNS control. A separate admin subdomain/site may require a separate Pages repository.
8. **Monetization:** Freemium remains a product direction, but paid entitlements and payment processing are deferred.

## Dependency order and phases

### Phase 1 — Repository foundation
- Establish project instructions, spec, plan, task list, and architecture decision record.
- Scaffold Vite/React/TypeScript with strict type checking and a small design-token foundation.
- Add lint, test, typecheck, and build scripts.
- Add CI workflow for pull requests and pushes to the working branch.
- Add and inspect the manual-only Pages deployment workflow; do not publish production while the repository is public unless separately approved.
- Run development CI and verification on feature branches. The repository is public by explicit user authorization; no further visibility change is authorized without approval.
- Add README, About page, navigation, and public Admin handoff page.

### Checkpoint A — Foundation review
- [x] Local development server starts and responds to the CI smoke test.
- [x] Lint, typecheck, tests, and build pass using `npm ci`.
- [x] CI workflow runs successfully, including dependency audit and dev-server smoke test.
- [x] No secrets or privileged tokens are present in the reviewed project files; CI uses read-only permissions.
- [x] Manual Pages workflow and artifact-upload path are reviewed and preflighted without publishing; Pages site settings and live deployment are deferred to release approval.
- [x] Repository visibility matches the user's explicit public-repository decision; production deployment remains disabled.
- [x] Human reviewed and approved the foundation before audio engine implementation on 2026-11-10.

### Phase 2 — Shared engineering foundations
- [x] Implement branded typed unit helpers, finite/range validation, amplitude decibel conversions, and sample-count conversion.
- [x] Implement explicit microphone session startup, capability detection, stable permission/device error states, and idempotent cleanup of media tracks and audio context.
- [x] Implement reusable tool panel, accessible level meter, and spectrum visualization primitives.
- [x] Add deterministic unit and component tests for shared primitives.
- [x] Verify responsive behavior in Chromium at desktop (1440px), tablet (768px), mobile (390px), and minimum supported mobile (320px) viewport sizes using Playwright.

### Checkpoint B — Engineering foundation review
- [x] Formula and audio primitives have deterministic tests.
- [x] Browser capability and permission failures are handled.
- [x] Visual components expose accessible semantics and numeric values; responsive behavior passes Playwright Chromium viewport tests.
- [x] Human approved all remaining planned BZaudio project work on 2026-11-10, including shared foundations and planned implementation phases.
- Playwright is approved and installed as a development dependency. CI installs Chromium and runs the responsive browser suite. Browser-level microphone permission-denial testing remains deferred until a microphone UI is integrated.

### Phase 3 — Release 1 tool slices
Implement in testable batches:
- [x] Batch 1: seven deterministic calculators — speaker delay, subwoofer alignment, crossover starting point, speaker coverage, SPL/distance, decibel, and gain/voltage (CI verified on 2026-11-11).
  - Speaker delay uses temperature-adjusted sound speed (331.3 + 0.606 × °C m/s; default 20°C).
  - Subwoofer alignment uses measured arrival times and delays the earlier-arriving source; it does not guess polarity or infer phase from distance alone.
  - Crossover suggests the geometric midpoint of the overlapping sub/top operating ranges; it is not an acoustic optimization or preset.
  - Coverage width assumes an ideal symmetric horizontal angle in a free field.
  - SPL/distance uses the free-field inverse-square approximation and excludes room reflections, directivity, compression, and atmospheric absorption.
  - Decibel conversions explicitly distinguish amplitude (20 log10) and power (10 log10) ratios.
  - Voltage gain uses 20 log10(Vout/Vin); it does not imply a specific amplifier load or power.
- [x] Batch 2: signal/noise/test generators (CI verified on 2026-11-11).
  - Signal generator uses Web Audio oscillators (sine, square, sawtooth, triangle) with a 20 Hz–20 kHz range and adjustable output level.
  - Pink and white noise use short in-memory audio buffers with looping playback; no file upload or network request.
  - Frequency sweep uses a sine oscillator with a logarithmic frequency ramp and bounded duration.
  - Test tone presets default to 1 kHz at -20 dBFS, with 100 Hz and 10 kHz options; output level remains adjustable down to -60 dBFS and up to 0 dBFS.
  - Every generator requires an explicit Start action, exposes Stop, and closes its AudioContext on stop/unmount/end. No generator starts automatically.
- Batch 3: audio input, metering, spectrum, phase, and feedback-analysis tools.

Every tool requires a short tool spec, unit/input validation, meaningful empty/error states, tests, and documented limitations.

### Checkpoint C — Release 1 review
- [ ] All 20 tools work in supported browsers.
- [ ] Calculations have known-answer and boundary tests.
- [ ] Audio tools handle permission denial, device loss, and unsupported APIs.
- [ ] No tool is presented as calibrated measurement without calibration.
- [ ] Human approves release candidate.

### Phase 4 — Release hardening
- Run accessibility, responsive, browser, dependency audit, and performance checks.
- Verify GitHub Pages base path and deep-link behavior.
- Document deployment and rollback procedures.
- Obtain explicit production deployment approval.

### Phase 5 — Release 2
Plan and implement the remaining 10 tools after Release 1 review; do not expand scope without approval.

## Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| GitHub Pages eligibility and repository configuration may block release | High | Verify plan eligibility and Pages settings at release time; keep production publication separately gated |
| GitHub Pages is static-only | High | No custom user auth, database, payment, or privileged admin API; document boundary clearly |
| Missing registered domain | Medium | Use GitHub Pages default URL initially; defer custom/admin subdomains |
| Browser audio API differences | High | Capability detection, explicit permission states, supported-browser testing |
| Uncalibrated microphone | High | Label estimates clearly; never claim calibrated SPL |
| DSP accuracy | High | Reference vectors, deterministic tests, documented algorithms and limitations |
| Large toolbox scope | High | Small vertical slices and human checkpoints |

## Open questions / external prerequisites
- Registered domain and DNS provider remain unknown.
- Repository is public by explicit user authorization during migration; no further visibility change is authorized without approval.
- GitHub Pages must be enabled and its deployment source configured by an authorized user if not already enabled.
- Confirm target browser support matrix during foundation implementation; default target is current stable Chrome, Edge, Firefox, and Safari.

## Approval checkpoints
The user has approved this architecture and plan. The repository is public by explicit user authorization during migration. Further approval is required before: adding external services, changing domain/DNS, enabling production deployment, merging to main, or materially changing the 30-tool scope. At final release readiness, verify the existing public setting and Pages eligibility before publishing.
