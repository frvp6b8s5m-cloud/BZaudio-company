# BZaudio Agent Rules

## Source of truth
- Follow the workflows in the `frvp6b8s5m-cloud/agent-skills` repository.
- Read the applicable skill before each development phase; skills are mandatory workflows, not optional advice.
- The approved product specification, implementation plan, task list, and ADRs in this repository are authoritative.
- Surface assumptions and conflicts before acting. Do not silently invent requirements.

## Approval gates
- Do not expand product scope, add external services, add authentication, add payment processing, change repository visibility, change DNS, or deploy without the required explicit approval.
- **Keep the repository private throughout development. The user intends to make it public at the end, for final publication. Do not change visibility earlier.**
- The user has authorized a public-at-release approach, not an immediate visibility change. Confirm readiness and obtain final release approval before the user changes visibility.
- Do not merge to `main` or publish a production release without explicit user approval.
- Pause at the checkpoints in `tasks/plan.md` and obtain review before crossing them.

## Architecture constraints
- Static frontend hosted on GitHub Pages; CI and deployment through GitHub Actions.
- React + TypeScript + Vite; browser-side Web Audio API and custom DSP where appropriate.
- No server backend, database, customer authentication, payment processor, subscription enforcement, or privileged admin API in this GitHub-only release.
- Browser-local storage is for non-sensitive user preferences/workspaces only. It is not an account system or secure storage.
- Never place secrets or privileged credentials in client code, repository files, or public workflows.
- The public admin surface must not imply that it is private or authenticated. Privileged operations remain in GitHub's permission-controlled interface.
- Do not configure a custom domain until the user supplies a registered domain and confirms DNS control.

## Engineering standards
- Build in small vertical slices; define acceptance criteria and verification for every task.
- Tests must demonstrate behavior; run tests, lint, type checks, build, and applicable security checks before commits.
- Keep commits atomic and descriptive. Work on the approved feature branch.
- Do not modify the existing BZaudio website or other repositories.
- Keep live-sound measurements technically honest: state calibration and hardware limitations; never present browser microphone readings as calibrated SPL.
