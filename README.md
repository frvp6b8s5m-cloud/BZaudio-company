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

Generators start only after an explicit user action, default to -20 dBFS, provide Stop controls, and allow only one generator to play at a time. Start with downstream PA/headphone gain low. The current live-analysis tools are:

- Peak/RMS meter (digital PCM dBFS)
- FFT spectrum analyzer (log-frequency display)
- Audio frequency analyzer (dominant FFT peak with interpolation)
- Real-time analyzer (nominal 1/3-octave bands)
- Feedback frequency finder (narrow spectral peak candidates)
- LUFS loudness meter (mono BS.1770-5 integrated loudness with gating)
- Phase/polarity analyzer (stereo channel correlation and phase difference at the dominant frequency)

Live analyzers request microphone access only after you press Start, share one capture session, and stop/close the input resources when stopped. Readings depend on the microphone, interface, input gain, and browser processing. They are dBFS/spectral estimates, not calibrated SPL. Feedback candidates are not proof of acoustic feedback. The LUFS meter implements mono integrated loudness only; it does not report true peak (dBTP) or stereo channel weighting. Phase/polarity comparison requires a two-channel input; it compares channel A with channel B and is not a substitute for acoustic loudspeaker alignment. All 20 approved Release 1 tools are now implemented in the review branch, including the local audio file player. Release 2 remains planned, not yet implemented.

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

The end-to-end suite runs against the production preview build using Playwright with Chromium, Firefox, and WebKit. The fake-microphone workflow runs in Chromium. Signal output is verified in Chromium and WebKit; the headless Firefox runner does not complete AudioContext.resume without an audio output device, so that specific hardware-dependent test is skipped there. Navigation, calculator, file playback, and accessibility checks run across all three engines.

```bash
npx playwright install chromium firefox webkit
npm run build
npm run test:e2e
```

The browser suite checks desktop, tablet, mobile, and minimum-width mobile layouts, including horizontal overflow and primary navigation. CI installs all three browser engines and runs these checks on every push and pull request.

## Architecture

- React + TypeScript + Vite static frontend.
- Browser Web Audio API for audio features; no server-side audio processing.
- Deterministic calculation and DSP primitives are kept independently testable.
- GitHub Actions runs lint, type checks, unit tests, browser tests, production build, server smoke test, and dependency audit.
- Static HTML includes a restrictive Content Security Policy and strict referrer policy; all app assets are same-origin and local audio playback uses temporary blob URLs.
- GitHub Pages production publication is manual and separately gated; no production deployment is performed by ordinary CI.

## Project administration

The public Admin section is a handoff to GitHub-native repository controls. It is not a private admin portal and contains no privileged client-side actions.

## About

Created by **BENTLEY ZERWAS**.

## Audio measurement limitations

Browser microphone readings depend on the connected hardware, browser processing, and calibration. BZaudio does not label uncalibrated microphone estimates as calibrated SPL measurements.
