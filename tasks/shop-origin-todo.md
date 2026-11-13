# BZaudio Shop + PROJECT ORIGIN Task List

Tasks are ordered by dependency. Do not mark a task complete until its acceptance criteria and verification pass. This list is a planning artifact only; implementation requires separate approval after technical-plan review.

## Phase 0 — Prerequisites and content validation
### Task 0.1: Confirm launch catalogue
- [ ] Select a small initial set of real products and exact model numbers.
- [ ] Record authoritative manufacturer source URLs for specifications.
- [ ] Omit unknown, unverified, or non-comparable specifications.
- Acceptance: every launch product has a verified model identity and source record.

### Task 0.2: Approve product imagery
- [ ] Identify manufacturer-authorized or licensed imagery for each launch product.
- [ ] Record usage/source details.
- Acceptance: every displayed image has a documented permitted source; no scraped or unlicensed images.

### Task 0.3: Confirm quote delivery
- [ ] Confirm configurable contact destination.
- [ ] Select a real, supported quote-submission mechanism compatible with the hosting architecture.
- [ ] Define privacy-minimal fields, validation, error and success behavior.
- Acceptance: submission is not enabled until a real delivery path is verified.

### Task 0.4: Confirm domain prerequisites
- [ ] Confirm registered domain and DNS control before configuring classified subdomain.
- Acceptance: if not confirmed, PROJECT: ORIGIN ships only as an in-site route in the implementation plan.

## Phase 1 — Shared navigation and route foundation
### Task 1.1: Define information architecture
- [ ] Add Shop and PROJECT: ORIGIN entry points without disrupting Toolbox, Approach, About, or Admin.
- [ ] Define route and navigation behavior compatible with GitHub Pages.
- Acceptance: all primary routes have clear navigation and working deep-link behavior.

### Task 1.2: Establish shared page components
- [ ] Reuse existing design tokens and component conventions.
- [ ] Add responsive page shell, breadcrumbs/back navigation where useful, and consistent focus states.
- Acceptance: shared components are keyboard accessible and responsive.

## Phase 2 — Shop
### Task 2.1: Typed product catalogue
- [ ] Define product, manufacturer, category, image, document, and specification types.
- [ ] Keep source references alongside product content.
- [ ] Add validation/tests for required identity and source fields.
- Acceptance: invalid/incomplete product entries cannot be published silently.

### Task 2.2: Shop landing and discovery
- [ ] Build showroom landing page and department navigation.
- [ ] Add manufacturer/category browsing and search/filter behavior.
- [ ] Add empty, no-results, and loading states as applicable.
- Acceptance: filters are usable by keyboard and touch; no fake stock or pricing.

### Task 2.3: Product detail
- [ ] Build product detail layout with verified specifications and authorized imagery.
- [ ] Add permitted manuals/document links and related items where available.
- [ ] Add quote request entry point.
- Acceptance: product detail renders only supported fields and labels missing data honestly.

### Task 2.4: Product comparison
- [ ] Compare only like-for-like sourced specifications.
- [ ] Clearly identify unavailable/non-comparable fields.
- Acceptance: no inferred or fabricated comparison values.

## Phase 3 — Quote requests
### Task 3.1: Quote request experience
- [ ] Add product-aware request form and input validation.
- [ ] Minimize personal data collection.
- [ ] Implement real delivery only after approved destination/mechanism is configured.
- [ ] Add explicit unavailable, submitting, success, and error states.
- Acceptance: no success message unless delivery mechanism confirms success; no false claim of submission.

## Phase 4 — PROJECT: ORIGIN
### Task 4.1: Classified route and identity
- [ ] Add route for PROJECT: ORIGIN.
- [ ] Display exact approved copy: “PROJECT: ORIGIN”; “Where the next era of audio begins.”; “THE FUTURE OF LIVE AUDIO IS UNDER DEVELOPMENT.”
- [ ] Keep the project itself unnamed beyond the approved codename and avoid invented claims.
- Acceptance: exact copy appears consistently and page works on mobile and desktop.

### Task 4.2: Cinematic visual experience
- [ ] Create classified facility-inspired art direction and motion system.
- [ ] Add restrained scan, reveal, signal, and redaction effects.
- [ ] Respect reduced-motion preference and avoid blocking content behind animation.
- Acceptance: keyboard access, contrast, responsive layout, and reduced-motion checks pass.

### Task 4.3: Theatrical access panel
- [ ] If included, label access interaction as a visual experience, not real authentication.
- [ ] Do not store credentials or imply actual security.
- Acceptance: no real login, access-control promise, or secret-bearing client code.

## Phase 5 — Verification and release review
### Task 5.1: Automated tests
- [ ] Add component/unit tests for shop discovery, product detail, comparisons, and quote states.
- [ ] Add Playwright coverage for new routes and primary flows.
- Acceptance: all new and existing tests pass.

### Task 5.2: Accessibility and responsive verification
- [ ] Verify keyboard navigation, visible focus, semantic labels, and contrast.
- [ ] Verify reduced-motion behavior.
- [ ] Verify desktop, tablet, mobile, and minimum supported viewport.
- Acceptance: no critical accessibility or horizontal-overflow regressions.

### Task 5.3: Full quality gate
- [ ] Run lint, typecheck, unit tests, Playwright, production build, and dependency audit.
- [ ] Review generated bundle and external requests.
- Acceptance: all checks pass and findings are documented.

### Checkpoint — Technical plan approval
- [ ] Present plan and task list for human review.
- [ ] Do not begin implementation until the user explicitly approves the technical plan.
- [ ] Do not merge to main, configure DNS, or deploy without separate approval.
