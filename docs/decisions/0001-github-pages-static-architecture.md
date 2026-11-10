# ADR-0001: GitHub Pages Static Architecture

## Status
Accepted — approved by the user on 2026-11-10.

## Context
BZaudio is a browser-based toolbox with 15–30 planned audio and engineering tools. The user explicitly requires the product to run using only GitHub and selected GitHub-only administration. The repository is currently private, and no registered custom domain has been provided.

## Decision
Use React + TypeScript + Vite for a static frontend, GitHub Pages for hosting, and GitHub Actions for CI and deployment. Use browser Web Audio APIs for audio features and browser-local storage only for non-sensitive preferences or local work.

Administrative authority remains in GitHub repository permissions and GitHub Actions. The website may offer an Admin handoff page, but it must be clearly public and must not expose privileged operations or claim to be private.

## Alternatives considered

### Full-stack application with an external backend
Would support customer accounts, subscription records, payment processing, and server-side admin APIs, but violates the user's GitHub-only hosting constraint. Deferred unless the user changes that constraint.

### Static site with a client-side password
Rejected because a password check implemented in public client-side code is not an access-control boundary.

### GitHub Pages plus a public admin dashboard that performs privileged writes
Rejected because public client code cannot safely hold privileged credentials.

## Consequences
- No custom customer accounts, server-side database, payment processing, subscription enforcement, or private admin API in this release.
- A freemium product direction can be reflected in product planning, but paid access control is deferred.
- The repository remains private throughout development and review. The user will make it public at the end, when the release candidate is ready for publication. Do not change visibility earlier.
- GitHub Actions CI can run while private. Public GitHub Pages publication on GitHub Free must wait until the repository is public; verify current Pages plan eligibility at release time.
- A custom domain and admin subdomain require a real registered domain and DNS control. A separate Pages site may require a separate repository.
- Browser audio measurements vary by device, browser, microphone, and calibration. UI must disclose these limitations.

## Verification
Before deployment, verify the final public visibility setting (changed by the user at release time), Pages plan eligibility, Pages configuration, workflow permissions, base-path routing, and production build output.
