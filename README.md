# BZaudio

A browser-based toolbox for live-sound professionals, system technicians, students, and audio enthusiasts.

BZaudio is being built around practical audio workflows: measurement, analysis, signal generation, and system-design calculations. The project is currently in private development.

## Development setup

Requirements: Node.js 22 or newer and npm.

```bash
npm install
npm run dev
```

## Quality commands

| Command | Purpose |
| --- | --- |
| `npm run lint` | Check source quality |
| `npm run typecheck` | Run strict TypeScript checks |
| `npm test` | Run the Vitest suite |
| `npm run build` | Type-check and create a production build |
| `npm run preview` | Preview the production build |

## Architecture

- React + TypeScript + Vite for the static frontend.
- Web Audio API and custom DSP for browser-side audio tools.
- GitHub Actions for continuous integration and deployment automation.
- GitHub Pages for the eventual public static site.
- No server-side customer accounts, payment processing, database, or privileged admin API in the GitHub-only release.

See [SPEC.md](./SPEC.md), [the implementation plan](./tasks/plan.md), and [ADR-0001](./docs/decisions/0001-github-pages-static-architecture.md) for the product and architecture decisions.

## Project administration

Project administration is controlled through GitHub repository permissions and approved workflows. The public site will not claim to provide a private admin dashboard.

The GitHub Pages release workflow is manual-only. Its deploy job is additionally blocked unless the repository is public, the selected ref is `main`, and the dispatch input explicitly authorizes publication. Keep the repository private during development; this workflow does not change repository visibility. Production publication still requires the project's release approval.

## About

BZaudio's goal is to make practical professional audio engineering and live-sound tools more accessible and useful.

**Created by BENTLEY ZERWAS.**
