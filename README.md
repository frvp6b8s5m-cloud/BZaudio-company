# BZaudio

A Studio-style live-sound engineering toolbox for practical analysis, system design, signal generation, and audio utilities.

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
