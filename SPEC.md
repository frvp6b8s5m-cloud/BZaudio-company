# BZaudio Product Specification

**Status:** Approved by user  
**Product:** BZaudio  
**Audience:** Live-sound professionals first; students, musicians, recording engineers, and audio enthusiasts second  
**Visual direction:** Studio  
**Business direction:** Freemium intent; monetization and entitlement enforcement deferred until a secure backend is separately approved  
**Primary repository:** `frvp6b8s5m-cloud/BZaudio-company`

## Objective

Build a polished, technically trustworthy browser-based toolbox that makes practical audio engineering and live-sound workflows easier to access. The product should help FOH and monitor engineers, system technicians, venue operators, and learners perform useful calculations, inspect audio, generate test signals, and understand system behavior.

Success means the released tools work correctly in supported browsers, explain their assumptions and limitations, are usable on desktop and mobile, and are covered by automated tests.

## Product scope

The approved product direction is a 30-tool toolbox delivered in two releases: 20 tools in Release 1 and 10 in Release 2. Exact sequencing may be refined in the implementation plan without silently removing approved capabilities.

### Release 1 — 20 tools
1. RTA
2. FFT Spectrum Analyzer
3. Audio Frequency Analyzer
4. LUFS Loudness Meter
5. Peak/RMS Meter
6. Phase/Polarity Analyzer
7. Feedback Frequency Finder
8. Signal Generator
9. Pink Noise Generator
10. White Noise Generator
11. Frequency Sweep
12. Audio Test Tone Generator
13. Speaker Delay Calculator
14. Subwoofer Alignment Calculator
15. Crossover Calculator
16. Speaker Coverage Calculator
17. SPL and Distance Calculator
18. Decibel Calculator
19. Gain and Voltage Calculator
20. Audio File Player

### Release 2 — 10 tools
21. Waveform Viewer
22. Audio File Analyzer
23. Channel and Frequency Inspection
24. Basic Audio Trimmer
25. Audio Export Utility
26. Frequency and Period Calculator
27. Power Calculator
28. Impedance Calculator
29. Audio Unit Converter
30. Wavelength Calculator

## Users and user needs

- Live-sound engineers need fast, clear tools that work at FOH, monitor world, or system setup.
- System technicians need transparent calculations with units, formulas, and assumptions.
- Learners need explanations that make the output understandable rather than opaque.
- Users should not be led to mistake an uncalibrated browser microphone for a calibrated measurement instrument.

## Experience and visual system

- Studio aesthetic: graphite/charcoal foundation, steel-gray surfaces, restrained electric blue/cyan accents, subtle signal-green status, technical typography, precise meters and waveform visualizations.
- Avoid clutter, generic dashboard patterns, and excessive gaming neon.
- Responsive desktop, tablet, and mobile layouts.
- Navigation: Home, Toolbox, Tools, About; Admin entry may link to GitHub-native controls.
- About page states the goal of BZaudio and includes the exact credit: **Created by BENTLEY ZERWAS.**

## Approved technical constraints

- Static frontend: React + TypeScript + Vite.
- Hosting: GitHub Pages.
- CI and deployment automation: GitHub Actions.
- Audio: Web Audio API and custom DSP modules, with deterministic pure-function calculations wherever possible.
- Tests: Vitest for unit/component behavior; Playwright for browser workflows when configured.
- No backend in this release. No custom customer accounts, server-side database, private subscription records, payment processing, or server-side admin API.
- Browser-local storage may persist non-sensitive preferences and local work only; it must not be represented as secure account storage.
- GitHub repository permissions and GitHub Actions are the only administrative authority. The public website must never contain privileged tokens or claim that a public static admin page is private.

## Commands (target project contract)

The implementation must provide these root scripts:
- `npm run dev` — local Vite development server
- `npm run build` — production build
- `npm run preview` — preview production output
- `npm run test` — Vitest suite
- `npm run lint` — lint source
- `npm run typecheck` — TypeScript type checking

Do not document a command as available until it exists and has been run successfully.

## Project structure (target)

```
src/
  app/             Application shell, routing, navigation
  components/      Shared UI components
  features/        Tool-specific vertical slices
  audio/           Browser audio engine and DSP primitives
  calculations/    Pure engineering calculations and unit helpers
  styles/          Design tokens and global styles
  content/         About and educational copy
tests/
  unit/
  integration/
e2e/
docs/
  decisions/
tasks/
.github/
  workflows/
```

## Code style

- TypeScript strict mode; explicit domain types and units.
- Pure functions for formulas; keep UI and calculation logic separate.
- Validate external inputs at boundaries; reject non-finite values and invalid units/ranges.
- Accessible semantic HTML, keyboard support, visible focus, and sufficient color contrast.
- Avoid raw HTML injection, `eval`, dynamic code execution, and unnecessary dependencies.

Example:

```ts
export function decibelsToLinearGain(decibels: number): number {
  if (!Number.isFinite(decibels)) {
    throw new RangeError("Decibels must be a finite number.");
  }

  return 10 ** (decibels / 20);
}
```

## Testing strategy

- Unit tests for every formula, conversion, DSP primitive, and boundary condition.
- Component/integration tests for input validation, units, state changes, and error states.
- Browser tests for navigation, responsive behavior, tool workflows, and audio permission denial.
- CI must run lint, typecheck, tests, and production build before changes are eligible for merge.
- Include edge cases, invalid input, zero/negative values where meaningful, clipping, permission denial, unsupported APIs, and browser capability differences.

## Boundaries

### Always
- Follow agent-skills.
- Keep main deployable and work on a feature branch.
- Run the applicable verification suite before committing.
- Explain formulas, units, assumptions, and measurement limitations.
- Keep all privileged operations inside GitHub.

### Ask first
- Any external service, backend, database, authentication, payment, analytics, or user-data collection.
- New dependencies with material bundle/security impact.
- New tools outside the approved 30-tool scope.
- Domain/DNS changes, repository visibility changes, deployment to production, or merging to main.

### Never
- Commit secrets or privileged tokens.
- Claim browser microphone measurements are calibrated SPL without calibration.
- Expose privileged administration in client-side code.
- Modify the existing BZaudio website or unrelated repositories.
- Claim a tool is implemented when it is only a mockup.

## Success criteria
- Release 1 contains 20 usable tools, each with documented inputs, outputs, units, and limitations.
- All core calculations have tests for normal and boundary cases.
- Site builds and deploys through GitHub Actions to GitHub Pages after configuration is approved.
- About page contains the stated company goal and creator credit.
- Admin experience is honest about public visibility and routes privileged work to GitHub.
- No secrets or unsupported security claims are present.

## Repository visibility and release sequence

- Keep the repository private throughout development, review, and testing.
- The user intends to change it to public only at the end, when the release candidate is ready for publication.
- GitHub Actions CI can run while private. Public GitHub Pages publication on GitHub Free must wait until the repository is public; verify the current plan and Pages eligibility at release time.
- Do not change visibility automatically or before the final release checkpoint.

## Open questions
- Registered domain and DNS provider are not yet supplied.
- A separate admin subdomain/site cannot be configured until a real domain is supplied; the admin experience will initially link to GitHub-native controls.
- Repository `BZaudio-company` is public by explicit user authorization during migration; production deployment remains separately gated.
