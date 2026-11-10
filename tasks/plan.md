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
- Add and test the Pages deployment workflow, but keep public production deployment disabled while the repository remains private.
- Run all development CI, previews, and verification while private. Do not change visibility during implementation.
- Add README, About page, navigation, and public Admin handoff page.

### Checkpoint A — Foundation review
- [ ] Local development starts.
- [ ] Lint, typecheck, tests, and build pass.
- [ ] CI workflow is valid and runs.
- [ ] No secrets or privileged tokens are present.
- [ ] GitHub Pages workflow and configuration are validated without publishing publicly.
- [x] Repository visibility matches the user's explicit public-repository decision; production deployment remains disabled.
- [ ] Human reviews foundation before audio engine implementation.

### Phase 2 — Shared engineering foundations
- Implement typed unit helpers, validation, and formula conventions.
- Implement audio capability detection, permission/error states, and safe audio lifecycle management.
- Implement reusable meter, spectrum, waveform, and tool-shell components with accessible interactions.
- Add tests for shared primitives.

### Checkpoint B — Engineering foundation review
- [ ] Formula and audio primitives have deterministic tests.
- [ ] Browser capability and permission failures are handled.
- [ ] Visual components are accessible and responsive.
- [ ] Human reviews before completing tool batches.

### Phase 3 — Release 1 tool slices
Implement in testable batches:
- Batch 1: calculators and deterministic engineering tools.
- Batch 2: signal/noise/test generators.
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
| Private repository cannot publish publicly to GitHub Free Pages | High | Keep repository private during development; user changes visibility at the final release stage, then verify Pages eligibility before publication |
| GitHub Pages is static-only | High | No custom user auth, database, payment, or privileged admin API; document boundary clearly |
| Missing registered domain | Medium | Use GitHub Pages default URL initially; defer custom/admin subdomains |
| Browser audio API differences | High | Capability detection, explicit permission states, supported-browser testing |
| Uncalibrated microphone | High | Label estimates clearly; never claim calibrated SPL |
| DSP accuracy | High | Reference vectors, deterministic tests, documented algorithms and limitations |
| Large toolbox scope | High | Small vertical slices and human checkpoints |

## Open questions / external prerequisites
- Registered domain and DNS provider remain unknown.
- Repository must remain private through development. User will change it to public at the end; no automated visibility change is authorized before final release readiness.
- GitHub Pages must be enabled and its deployment source configured by an authorized user if not already enabled.
- Confirm target browser support matrix during foundation implementation; default target is current stable Chrome, Edge, Firefox, and Safari.

## Approval checkpoints
The user has approved this architecture and plan. Keep the repository private until the final release stage. Further approval is required before: adding external services, changing domain/DNS, enabling production deployment, merging to main, or materially changing the 30-tool scope. At final release readiness, ask the user to make the repository public; verify the setting and Pages eligibility before publishing.
