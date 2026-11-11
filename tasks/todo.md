# BZaudio Task List

Tasks are ordered by dependency. Check a task only after its acceptance criteria and verification pass. Follow the corresponding agent-skills workflow.

## Phase 1 — Repository foundation

### Task 1: Add project scaffold
**Description:** Establish the Vite, React, and strict TypeScript foundation.
**Acceptance criteria:**
- [x] App starts with `npm run dev` and builds with `npm run build`.
- [x] Strict TypeScript checking is enabled.
- [x] Vite uses a relative asset base for repository Pages hosting.
**Verification:** Locked install, CI development-server smoke test, typecheck, and production build passed.
**Dependencies:** Approved plan.
**Files likely touched:** `package.json`, lockfile, `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/main.tsx`.
**Estimated scope:** Medium.

### Task 2: Establish quality tooling
**Description:** Add linting, test conventions, Vitest, and quality scripts.
**Acceptance criteria:**
- [x] `npm run lint`, `npm run typecheck`, and `npm run test` exist.
- [x] App component tests prove the test runner works.
- [x] CI uses `npm ci` from the committed lockfile.
**Verification:** CI passed lint, strict typecheck, Vitest, build, and `npm audit --audit-level=high`.
**Dependencies:** Task 1.
**Files likely touched:** package scripts/config, test config, sample test.
**Estimated scope:** Medium.

### Task 3: Add design foundation and app shell
**Description:** Build the responsive Studio visual shell and primary navigation.
**Acceptance criteria:**
- [x] Home, Toolbox, Approach, About, and Admin handoff sections render through working anchor navigation.
- [x] Navigation uses native links and visible `:focus-visible` styling.
- [x] Responsive breakpoints cover mobile, tablet, and desktop layouts.
**Verification:** Component tests assert all section targets; CSS review confirms responsive breakpoints and reduced-motion support. CI smoke-checks the Vite dev server.
**Dependencies:** Task 1.
**Files likely touched:** `src/app/`, `src/components/`, `src/styles/`.
**Estimated scope:** Medium.

### Task 4: Add About and Admin handoff content
**Description:** Explain BZaudio's mission and creator credit; route admin users to GitHub-native controls.
**Acceptance criteria:**
- [x] About section describes the approved goal.
- [x] Exact creator credit reads “CREATED BY BENTLEY ZERWAS.”
- [x] Admin handoff states the site is public and contains no privileged client-side actions; link points to `BZaudio-company`.
**Verification:** Component tests assert creator credit, public-admin boundary, and primary repository link.
**Dependencies:** Task 3.
**Files likely touched:** `src/content/`, app routes/components.
**Estimated scope:** Small.

### Task 5: Add CI workflow
**Description:** Run quality checks on pull requests and relevant pushes.
**Acceptance criteria:**
- [x] Workflow runs lint, typecheck, tests, build, dev-server smoke test, and dependency audit.
- [x] Workflow uses `contents: read` only.
- [x] CI requires no secrets.
**Verification:** Inspect workflow and confirm a GitHub Actions run passes.
**Dependencies:** Task 2.
**Files likely touched:** `.github/workflows/ci.yml`.
**Estimated scope:** Small.

### Task 6: Add gated GitHub Pages deployment workflow
**Description:** Configure build and Pages artifact deployment with production publication gated on repository settings and approval.
**Acceptance criteria:**
- [x] Manual workflow builds and uploads a GitHub Pages artifact.
- [x] `pages: write` and `id-token: write` are scoped to the deploy job.
- [x] Deploy job requires public visibility, `main`, and explicit `publish: true`; Pages settings/live deployment remain deferred to release.
**Verification:** Pages artifact preflight passed without publishing. Actual Pages site configuration and live deployment remain release-stage work requiring separate approval.
**Dependencies:** Task 5.
**Files likely touched:** `.github/workflows/deploy-pages.yml`.
**Estimated scope:** Medium.

### Checkpoint A — Foundation review
- [x] Tasks 1–6 technical foundation criteria verified.
- [x] Technical Definition of Done checks pass; human review is the remaining approval gate.
- [x] Human reviewed and approved the foundation before Phase 2 on 2026-11-10.

## Phase 2 — Shared engineering foundations

### Task 7: Typed unit and validation primitives
**Acceptance criteria:**
- [x] Domain values carry explicit units through branded TypeScript types.
- [x] Invalid, non-finite, and out-of-range inputs are handled consistently.
- [x] Formula helpers have known-answer and boundary tests.
**Verification:** Vitest coverage for frequency, distance, decibels, sample rate, amplitude gain conversions, and milliseconds-to-samples boundaries. CI passed.
**Dependencies:** Checkpoint A.
**Files likely touched:** `src/calculations/`, `tests/unit/`.
**Estimated scope:** Medium.

### Task 8: Browser audio lifecycle foundation
**Acceptance criteria:**
- [x] Audio contexts and media streams have explicit lifecycle cleanup.
- [x] Permission denial, no device, and unsupported APIs show clear states.
- [x] No microphone capture starts without user action.
**Verification:** Vitest covers explicit start, idempotent stop, track/context cleanup, permission denial, missing devices, unsupported APIs, and cleanup after context creation failure. CI passed. Real-browser permission-denial automation remains part of browser hardening.
**Dependencies:** Checkpoint A.
**Files likely touched:** `src/audio/`, tests.
**Estimated scope:** Medium.

### Task 9: Reusable visualization and tool shell
**Acceptance criteria:**
- [x] Shared tool layout, meter, and spectrum primitives expose accessible labels and numeric values.
- [x] Visualizations communicate level/height and numeric summaries, not color alone.
- [x] Responsive behavior is verified in Chromium at desktop (1440px), tablet (768px), mobile (390px), and minimum supported mobile (320px) viewports.
**Verification:** Vitest component tests and Playwright Chromium viewport/navigation tests pass in CI. Playwright reports and traces are retained on failure. Real-browser microphone permission-denial testing is deferred until a microphone control is integrated into the app.
**Dependencies:** Tasks 7–8.
**Files likely touched:** `src/components/`, `src/features/shared/`.
**Estimated scope:** Medium.

### Checkpoint B — Engineering review
- [x] Tasks 7–9 technical acceptance criteria verified; browser-level microphone permission denial remains a later integration check when a microphone UI exists.
- [x] Human approved all remaining planned BZaudio project work on 2026-11-10.

## Phase 3 — Release 1 tools

### Task 10: Deterministic calculator tools
**Acceptance criteria:** [x] Seven calculators have explicit formulas, units, input validation, visible assumptions, accessible outputs, and reference/boundary tests.
**Verification:** CI run 42929172068 passed lint, strict typecheck, 44 unit/component tests across 6 files, 6 Chromium browser tests, production build, dev-server smoke test, and npm audit.
**Dependencies:** Checkpoint B.
**Files likely touched:** `src/calculations/engineering.ts`, `src/calculations/engineering.test.ts`, `src/features/calculators/`, `src/App.tsx`, tests.
**Estimated scope:** Seven small vertical slices, delivered in two commits.

#### Task 10.1: Speaker delay calculator
- [x] Calculate propagation delay from distance and temperature-adjusted speed of sound.
- [ ] Show speed-of-sound assumption, milliseconds, and formula.
- [ ] Validate finite non-negative distance and supported temperature range.
- **Verification:** Reference values at 0°C and 20°C plus boundary tests.

#### Task 10.2: Subwoofer alignment calculator
- [x] Accept measured main and sub arrival times in milliseconds.
- [ ] Identify the earlier-arriving source and calculate its required delay.
- [ ] Avoid automatic polarity or phase recommendations.
- **Verification:** Main-earlier, sub-earlier, equal-arrival, and invalid-value tests.

#### Task 10.3: Crossover starting-point calculator
- [x] Accept subwoofer upper and main-speaker lower operating limits.
- [ ] Return no-overlap state when the ranges do not overlap.
- [ ] Suggest geometric midpoint only when overlap exists.
- **Verification:** Overlap, boundary-touch, no-overlap, and invalid-value tests.

#### Task 10.4: Speaker coverage calculator
- [x] Calculate ideal coverage width from throw distance and horizontal angle.
- [ ] State symmetric-angle/free-field assumptions.
- **Verification:** Known-angle reference and invalid-angle boundaries.

#### Task 10.5: SPL and distance calculator
- [x] Calculate SPL at a new distance and distance for a target SPL.
- [ ] State inverse-square/free-field limitations.
- **Verification:** Doubling distance produces approximately -6.02 dB; inverse operation round-trips.

#### Task 10.6: Decibel calculator
- [x] Convert amplitude and power ratios to dB and back.
- [ ] Keep amplitude and power modes explicitly distinct.
- **Verification:** 2× amplitude, 2× power, unity, and invalid-value tests.

#### Task 10.7: Gain and voltage calculator
- [x] Calculate voltage gain in dB and output voltage from input voltage plus gain.
- [ ] Validate positive voltage and finite gain.
- **Verification:** 2× voltage, 0 dB, and inverse calculation tests.

### Task 11: Signal and noise generators
**Acceptance criteria:** Five generator tools produce controllable output, default to a conservative level, start only after user action, and release audio resources cleanly.
**Verification:** Deterministic DSP tests, mocked audio-graph lifecycle tests, and Chromium start/stop browser checks.
**Dependencies:** Task 8.
**Files likely touched:** `src/audio/`, `src/features/generators/`, tests.
**Estimated scope:** Five small vertical slices.

#### Task 11.1: Signal generator
- [ ] Sine, square, sawtooth, and triangle waveforms.
- [ ] Frequency input 20 Hz–20 kHz and output level -60 to 0 dBFS.
- [ ] Explicit Start/Stop controls and lifecycle cleanup.
- **Verification:** Mocked oscillator type/frequency/gain and cleanup tests.

#### Task 11.2: Pink noise generator
- [ ] Generate bounded pink-noise buffer and loop during playback.
- [ ] Conservative -20 dBFS default and explicit stop.
- **Verification:** Deterministic sample tests and looping buffer-source tests.

#### Task 11.3: White noise generator
- [ ] Generate bounded white-noise buffer and loop during playback.
- [ ] Conservative -20 dBFS default and explicit stop.
- **Verification:** Deterministic sample tests and looping buffer-source tests.

#### Task 11.4: Frequency sweep
- [ ] Sine sweep from configurable start to end frequency over a bounded duration.
- [ ] Use a logarithmic frequency ramp and stop/close automatically at the end.
- **Verification:** Ramp scheduling and cleanup tests.

#### Task 11.5: Audio test tone generator
- [ ] Presets at 100 Hz, 1 kHz, and 10 kHz.
- [ ] Default 1 kHz at -20 dBFS; adjustable level from -60 to 0 dBFS.
- [ ] Explicit start/stop; warn users to begin with downstream gain low.
- **Verification:** Preset mapping, gain, and browser playback control tests.

### Task 12: Analysis and metering tools
**Acceptance criteria:** [ ] RTA, FFT, frequency, LUFS, peak/RMS, phase/polarity, and feedback analysis have stated limits and meaningful output.
**Verification:** Deterministic signal fixtures, reference comparisons, and browser tests.
**Dependencies:** Tasks 8–9.
**Files likely touched:** `src/audio/`, `src/features/`, tests.
**Estimated scope:** Split into smaller per-tool tasks before implementation.

### Task 13: Audio file player
**Acceptance criteria:** [ ] Local audio files can be selected and played without upload to a server; unsupported formats and errors are handled.
**Verification:** Browser tests with fixture audio.
**Dependencies:** Checkpoint B.
**Files likely touched:** `src/features/`, tests.
**Estimated scope:** Medium.

### Checkpoint C — Release 1 review
- [ ] All 20 Release 1 tools are implemented and verified; task groups are decomposed into individual tool tasks before execution.
- [ ] Human approves release candidate.

## Phase 4 — Hardening and release

### Task 14: Accessibility, browser, and performance audit
**Acceptance criteria:** [ ] Keyboard, screen-reader labels, contrast, mobile layouts, and supported-browser behavior are checked.
**Verification:** Automated and manual audit.
**Dependencies:** Checkpoint C.
**Files likely touched:** App source, tests, docs.
**Estimated scope:** Medium.

### Task 15: Security and dependency audit
**Acceptance criteria:** [ ] No secrets, unsafe HTML injection, unneeded permissions, or unreviewed high-risk dependencies.
**Verification:** Native package audit, workflow permission review, staged-diff secret scan.
**Dependencies:** Checkpoint C.
**Files likely touched:** Config and documentation only if findings require changes.
**Estimated scope:** Small.

### Task 16: Pages deployment and rollback verification
**Acceptance criteria:** [ ] Correct project base path, deep links, artifact deployment, and rollback procedure are verified.
**Verification:** GitHub Actions run and live smoke test after explicit deployment approval.
**Dependencies:** Tasks 6, 14, 15; repository Pages prerequisites.
**Files likely touched:** Workflows and deployment docs.
**Estimated scope:** Medium.

### Checkpoint D — Release approval
- [ ] Full Definition of Done passes.
- [ ] User explicitly approves production deployment and merge to main.

## Release 2
Create individual task cards for the remaining 10 approved tools after Release 1 review. Do not start Release 2 before the user approves its plan.
