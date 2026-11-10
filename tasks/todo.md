# BZaudio Task List

Tasks are ordered by dependency. Check a task only after its acceptance criteria and verification pass. Follow the corresponding agent-skills workflow.

## Phase 1 — Repository foundation

### Task 1: Add project scaffold
**Description:** Establish the Vite, React, and strict TypeScript foundation.
**Acceptance criteria:**
- [ ] App starts with `npm run dev` and builds with `npm run build`.
- [ ] Strict TypeScript checking is enabled.
- [ ] Vite base path supports repository Pages URL.
**Verification:** Install from lockfile; run dev smoke check, typecheck, and production build.
**Dependencies:** Approved plan.
**Files likely touched:** `package.json`, lockfile, `index.html`, `vite.config.ts`, `tsconfig*.json`, `src/main.tsx`.
**Estimated scope:** Medium.

### Task 2: Establish quality tooling
**Description:** Add linting, formatting conventions, Vitest, and scripts.
**Acceptance criteria:**
- [ ] `npm run lint`, `npm run typecheck`, and `npm run test` exist.
- [ ] A sample test proves the test runner works.
- [ ] CI commands are reproducible from a clean install.
**Verification:** Run all scripts locally.
**Dependencies:** Task 1.
**Files likely touched:** package scripts/config, test config, sample test.
**Estimated scope:** Medium.

### Task 3: Add design foundation and app shell
**Description:** Build the responsive Studio visual shell and primary navigation.
**Acceptance criteria:**
- [ ] Home, Toolbox, About, and Admin handoff routes render.
- [ ] Keyboard navigation and visible focus work.
- [ ] Layout adapts to mobile and desktop widths.
**Verification:** Component tests and browser smoke test.
**Dependencies:** Task 1.
**Files likely touched:** `src/app/`, `src/components/`, `src/styles/`.
**Estimated scope:** Medium.

### Task 4: Add About and Admin handoff content
**Description:** Explain BZaudio's mission and creator credit; route admin users to GitHub-native controls.
**Acceptance criteria:**
- [ ] About page describes the approved goal.
- [ ] Exact creator credit reads “Created by BENTLEY ZERWAS.”
- [ ] Admin page clearly states it is public and contains no privileged client-side actions.
**Verification:** Content assertions and manual browser check.
**Dependencies:** Task 3.
**Files likely touched:** `src/content/`, app routes/components.
**Estimated scope:** Small.

### Task 5: Add CI workflow
**Description:** Run quality checks on pull requests and relevant pushes.
**Acceptance criteria:**
- [ ] Workflow runs lint, typecheck, tests, and build.
- [ ] Workflow uses least-privilege permissions.
- [ ] No secrets are required for CI.
**Verification:** Inspect workflow and confirm a GitHub Actions run passes.
**Dependencies:** Task 2.
**Files likely touched:** `.github/workflows/ci.yml`.
**Estimated scope:** Small.

### Task 6: Add gated GitHub Pages deployment workflow
**Description:** Configure build and Pages artifact deployment with production publication gated on repository settings and approval.
**Acceptance criteria:**
- [ ] Workflow follows GitHub Pages artifact deployment.
- [ ] Deployment permissions are scoped to the Pages job.
- [ ] Deployment does not run until Pages prerequisites are verified.
**Verification:** Workflow validation and, after settings are ready, a non-production Pages verification.
**Dependencies:** Task 5.
**Files likely touched:** `.github/workflows/deploy-pages.yml`.
**Estimated scope:** Medium.

### Checkpoint A — Foundation review
- [ ] Tasks 1–6 verified.
- [ ] Full Definition of Done checklist satisfied.
- [ ] Human reviews the foundation before Phase 2.

## Phase 2 — Shared engineering foundations

### Task 7: Typed unit and validation primitives
**Acceptance criteria:**
- [ ] Domain values carry explicit units.
- [ ] Invalid, non-finite, and out-of-range inputs are handled consistently.
- [ ] Formula helpers have known-answer and boundary tests.
**Verification:** Unit tests.
**Dependencies:** Checkpoint A.
**Files likely touched:** `src/calculations/`, `tests/unit/`.
**Estimated scope:** Medium.

### Task 8: Browser audio lifecycle foundation
**Acceptance criteria:**
- [ ] Audio contexts and media streams have explicit lifecycle cleanup.
- [ ] Permission denial, no device, and unsupported APIs show clear states.
- [ ] No microphone capture starts without user action.
**Verification:** Unit/integration tests plus browser permission-denial test.
**Dependencies:** Checkpoint A.
**Files likely touched:** `src/audio/`, tests.
**Estimated scope:** Medium.

### Task 9: Reusable visualization and tool shell
**Acceptance criteria:**
- [ ] Shared tool layout, meter, and chart primitives are accessible.
- [ ] Visualizations do not rely on color alone.
- [ ] Responsive behavior is verified.
**Verification:** Component and browser tests.
**Dependencies:** Tasks 7–8.
**Files likely touched:** `src/components/`, `src/features/shared/`.
**Estimated scope:** Medium.

### Checkpoint B — Engineering review
- [ ] Tasks 7–9 verified.
- [ ] Human reviews shared foundations before tool batches.

## Phase 3 — Release 1 tools

### Task 10: Deterministic calculator tools
**Acceptance criteria:** [ ] Speaker delay, subwoofer alignment, crossover, coverage, SPL/distance, decibel, and gain/voltage calculations have formulas, units, validation, and tests.
**Verification:** Reference calculations and boundary tests.
**Dependencies:** Checkpoint B.
**Files likely touched:** `src/calculations/`, `src/features/`, tests.
**Estimated scope:** Split into smaller per-tool tasks before implementation.

### Task 11: Signal and noise generators
**Acceptance criteria:** [ ] Signal, pink noise, white noise, sweep, and test tone generation are controllable and stop cleanly.
**Verification:** Audio graph tests and browser playback checks.
**Dependencies:** Task 8.
**Files likely touched:** `src/audio/`, `src/features/`, tests.
**Estimated scope:** Split into smaller per-tool tasks before implementation.

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
