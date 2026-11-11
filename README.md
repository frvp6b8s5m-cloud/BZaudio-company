# BZaudio

A Studio-style live-sound engineering toolbox for practical analysis, system design, signal generation, and audio utilities.

## Available Release 1 calculators

The current toolbox includes seven working calculators:

- Speaker delay (temperature-adjusted speed of sound)
- Subwoofer alignment (measured arrival-time comparison)
- Crossover starting point (geometric midpoint of overlapping operating limits)
- Speaker coverage (ideal horizontal coverage width)
- SPL and distance (free-field inverse-square estimate)
- Decibel conversion (amplitude and power ratios)
- Gain and voltage (voltage-ratio calculations)

Each calculator updates as inputs change and shows units, formulas, and relevant assumptions.

The current signal-generation tools are:

- Signal generator (sine, square, sawtooth, triangle)
- Pink noise and white noise generators
- Logarithmic frequency sweep
- Audio test tones (100 Hz, 1 kHz, 10 kHz)

Generators start only after an explicit user action, default to -20 dBFS, provide Stop controls, and allow only one generator to play at a time. Start with downstream PA/headphone gain low. The remaining Release 1 tools are still in development.

## Development

Requirements: Node.js 22 and npm.

```bash
npm ci
npm run dev
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

## Browser tests

The responsive end-to-end suite uses Playwright with Chromium.

```bash
npx playwright install chromium
npm run test:e2e
```

The browser suite checks desktop, tablet, mobile, and minimum-width mobile layouts, including horizontal overflow and primary navigation. CI installs Chromium and runs these checks on every push and pull request.

## Architecture

- React + TypeScript + Vite static frontend.
- Browser Web Audio API for audio features; no server-side audio processing.
- Deterministic calculation and DSP primitives are kept independently testable.
- GitHub Actions runs lint, type checks, unit tests, browser tests, production build, server smoke test, and dependency audit.
- GitHub Pages production publication is manual and separately gated; no production deployment is performed by ordinary CI.

## Project administration

The public Admin section is a handoff to GitHub-native repository controls. It is not a private admin portal and contains no privileged client-side actions.

## About

Created by **BENTLEY ZERWAS**.

## Audio measurement limitations

Browser microphone readings depend on the connected hardware, browser processing, and calibration. BZaudio does not label uncalibrated microphone estimates as calibrated SPL measurements.
