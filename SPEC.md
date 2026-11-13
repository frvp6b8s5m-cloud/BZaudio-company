# BZaudio Product Specification

**Status:** Updated specification — awaiting user review and approval  
**Product:** BZaudio  
**Primary repository:** `frvp6b8s5m-cloud/BZaudio-company`  
**Working branch:** `chore/reconcile-public-repo-docs`  
**Architecture:** React + TypeScript + Vite static browser application; GitHub Pages target  
**Workflow:** Follow the mandatory skills in `frvp6b8s5m-cloud/agent-skills`

## Objective

Build BZaudio as a premium audio-technology company experience with three connected capabilities:

1. A trustworthy browser-based live-sound engineering toolbox.
2. A curated professional audio equipment shop for established manufacturers.
3. A cinematic, deliberately mysterious classified project experience introducing **PROJECT: ORIGIN**.

BZaudio develops software and audio technology. It does **not** manufacture physical speakers, mixers, amplifiers, microphones, or other sound equipment. The shop may sell products made by established manufacturers. BZaudio's own products are software and technology.

The company philosophy is to prioritize sound quality and the connection people experience through music—not loudness as an end in itself. The visual experience should feel premium, distinctive, and immersive while remaining easy to understand and never overwhelming.

Success means that each capability is useful and honest about what it can do; the shop presents accurate product information; PROJECT: ORIGIN has a memorable visual identity without making false security claims; and the site remains responsive, accessible, performant, and testable.

## Approved capability map

The user approved these independently testable capabilities on 2026-11-13:

| ID | Capability | Responsibility |
|---|---|---|
| TOOLBOX | Engineering toolbox | Existing live-sound tools and their verified behavior |
| SHOP | Equipment showroom | Manufacturer and category browsing, product details, comparisons, and quote intent |
| QUOTE | Quote requests | A clear product enquiry flow, with a configurable contact destination |
| ORIGIN | Classified project experience | The PROJECT: ORIGIN identity, cinematic presentation, and restricted-access theatrical treatment |

Keep these capabilities modular. The toolbox, shop, and classified experience must not become one crowded dashboard or one confusing navigation flow.

## Capability: TOOLBOX — existing engineering platform

Preserve the existing approved 30-tool scope. Do not silently remove, rename, or claim new tools are complete.

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

### Toolbox user needs and limitations

- Live-sound engineers need practical tools that work at FOH, monitor world, and during system setup.
- System technicians need transparent calculations with units, formulas, assumptions, and limitations.
- Learners need understandable explanations rather than opaque outputs.
- Browser microphone readings must never be represented as calibrated SPL without a valid calibration workflow and supported measurement chain.
- Hardware integrations and console control must be verified model by model. Do not claim universal Allen & Heath or Yamaha support without real compatibility testing.
- Any future direct console integration must use documented interfaces and explicit capability checks; it must not be implied by a static marketing page.

## Capability: SHOP — professional equipment showroom

### Purpose

Create a premium, easy-to-navigate showroom where customers can discover professional audio equipment from established manufacturers and understand which products suit their needs.

The shop is a retailer/showroom for physical equipment made by other manufacturers. BZaudio does not design or manufacture its own physical sound equipment as part of this scope.

### Departments and discovery

Support clear, expandable departments such as:

- Mixing consoles
- PA systems and loudspeakers
- Microphones
- Signal processors and effects
- Amplification and system processing
- Stage, monitoring, and audio accessories

Allow customers to browse by manufacturer, product family, and category. The catalog should be structured so new verified products and departments can be added without redesigning the whole shop.

### Product detail requirements

A product detail view should support, where reliable information is available:

- Manufacturer and exact model name
- Licensed or manufacturer-approved product photography
- Multiple product images when authorized and available
- Verified specifications and feature descriptions
- Manufacturer documentation/manual links
- Relevant compatible accessories or related equipment, only when compatibility is verified
- Product comparisons using equivalent, sourced specification fields
- Clear quote-request action

Do not fabricate stock status, pricing, specifications, compatibility, reviews, or product images. If a field is unknown or unavailable, omit it or clearly mark it as unavailable rather than guessing.

### Visual and interaction direction

- Premium architectural presentation with strong product imagery and disciplined typography.
- Category-specific motion should be subtle and purposeful: console channel/fader motifs, speaker/driver movement, microphone waveform cues, and processor spectrum/meter details.
- Motion must not obscure product information or slow navigation.
- Respect reduced-motion preferences and maintain accessible keyboard and touch behavior.
- Keep navigation and product discovery simple. Avoid a cluttered catalog, excessive animation, and generic AI-style presentation.
- The store should feel visually connected to BZaudio without making the main site overwhelming.

### Commercial boundary

- Initial commercial intent is quote requests, not a fabricated instant-purchase experience.
- Do not add checkout, payment processing, inventory management, customer accounts, subscriptions, or order history in this scope.
- The quote destination must be configurable; do not hard-code an invented contact address.
- The quote submission mechanism is an open technical decision because the current application is static and has no backend. Do not add a third-party service or backend without separate approval.
- Do not claim that a quote has been received or stored unless a real, verified submission mechanism confirms it.

## Capability: ORIGIN — classified project experience

### Approved identity

**PROJECT: ORIGIN**  
*Where the next era of audio begins.*

Primary page headline:

**THE FUTURE OF LIVE AUDIO IS UNDER DEVELOPMENT.**

The name and tagline are approved. Do not replace them with alternate codenames or add the rejected line “YOU WERE NOT SUPPOSED TO FIND THIS.”

### Experience direction

Create a cinematic, restrained, classified-project presentation that makes visitors feel they have encountered a major BZaudio technology initiative. Keep the underlying project details intentionally undisclosed.

Visual direction may include:

- A dark, premium secure-facility or vault-inspired environment.
- Carefully paced boot-up or system-initialization sequence.
- Restrained scanning lines, signal traces, access panels, subtle surveillance-inspired details, and redacted project information.
- Clear hierarchy: PROJECT: ORIGIN, its tagline, the main headline, and access-status details.
- Responsive transitions and meaningful motion that enhance the reveal rather than delay access to content.
- A reduced-motion experience and keyboard-accessible controls.

Use language such as “CLASSIFIED,” “ACCESS RESTRICTED,” and “SECURITY LEVEL 05” only as theatrical brand presentation.

### Honesty and security boundary

- The page is a marketing/brand experience, not a real secure portal.
- Do not imply government classification, real surveillance, encryption, authentication, or protection that does not exist.
- Do not collect credentials or present a fake login as real security.
- Do not expose actual confidential plans, credentials, or private operational data.
- Keep the actual project technology unnamed until the company chooses to reveal it.

### Intended address and domain constraint

The intended public address is **`classified.bzaudio.com`**. The registered domain, DNS provider, and DNS control have not yet been confirmed in this repository context.

Until the domain and hosting arrangement are confirmed, the implementation may be developed and tested as an internal route/page in the existing application. Do not change DNS, configure a custom domain, publish a separate subdomain, or create another repository without the required confirmation and approval. The technical plan must determine whether the subdomain can be served from the existing hosting setup or requires a separate site/repository.

## Users and audiences

- Live-sound engineers and system technicians use the toolbox.
- Venues, production teams, musicians, and audio professionals browse the equipment showroom.
- Customers seeking equipment use quote requests to start a sales conversation.
- Visitors and industry professionals encounter PROJECT: ORIGIN as a high-impact brand experience.
- The overall site must support both experienced professionals and less technical customers without overwhelming either group.

## Experience and visual system

- Maintain a premium architectural/cinematic identity with clear navigation and strong information hierarchy.
- The site must feel distinctive, not like a generic AI-generated template or generic dashboard.
- Keep the main navigation focused; place specialist experiences such as the toolbox, shop, and PROJECT: ORIGIN in clear, separate destinations.
- Use immersive motion selectively, with performance budgets, accessible focus states, and reduced-motion alternatives.
- Product imagery and accurate information take priority over decorative effects.
- Ensure desktop, tablet, and mobile layouts are deliberately designed, not merely compressed desktop layouts.

## Approved technical constraints

- Static frontend: React + TypeScript + Vite.
- Hosting target: GitHub Pages, subject to existing release gates and domain constraints.
- CI and deployment automation: GitHub Actions.
- Audio: Web Audio API and custom DSP modules, with deterministic pure-function calculations wherever possible.
- Tests: Vitest for unit/component behavior; Playwright for browser workflows.
- No backend is currently approved. No custom customer accounts, server-side database, private subscription records, payment processing, or server-side admin API.
- Browser-local storage may persist non-sensitive preferences and local work only; it must not be represented as secure account storage.
- GitHub repository permissions and GitHub Actions are the only administrative authority. The public website must never contain privileged tokens or claim that a public static admin page is private.
- Product catalog content must be traceable to manufacturer or other authorized sources. Product imagery must be licensed or manufacturer-approved.
- New dependencies with material bundle, security, or maintenance impact require review under repository rules.

## Commands

The existing repository scripts are:

- `npm run dev` — local Vite development server
- `npm run build` — TypeScript check and production build
- `npm run preview` — preview production output
- `npm run test` — Vitest suite
- `npm run test:e2e` — Playwright browser suite
- `npm run lint` — ESLint
- `npm run typecheck` — TypeScript type checking

Do not document a command as available until it exists and has been run successfully.

## Project structure (target)

Preserve existing structure and introduce feature boundaries only where they fit established patterns:

```
src/
  app/                 Application shell, navigation, and route composition
  components/          Shared accessible UI components
  features/
    toolbox/           Existing live-sound tools
    shop/              Catalog, product discovery, detail, and comparison
    quote/             Quote-request experience
    origin/            PROJECT: ORIGIN classified experience
  audio/               Browser audio engine and DSP primitives
  calculations/        Pure engineering calculations and unit helpers
  styles/              Design tokens and global styles
  content/             Mission, product, and editorial content
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

Do not relocate existing code simply to match this illustrative structure. Inspect the actual codebase and preserve working conventions.

## Code style and engineering standards

- TypeScript strict mode; explicit domain types and units.
- Pure functions for formulas; keep UI and calculation logic separate.
- Validate external inputs at boundaries; reject non-finite values and invalid units/ranges.
- Accessible semantic HTML, keyboard support, visible focus, and sufficient color contrast.
- Avoid raw HTML injection, `eval`, dynamic code execution, and unnecessary dependencies.
- Keep components focused and avoid abstractions that do not earn their complexity.
- Keep product content data separate from presentation so sourcing and review remain straightforward.
- Animation must not be required to understand or operate any feature.

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
- Component/integration tests for input validation, units, state changes, quote form validation, and error states.
- Browser tests for navigation, responsive behavior, toolbox workflows, shop browsing, product detail, quote intent, and PROJECT: ORIGIN presentation.
- Test reduced-motion behavior, keyboard access, focus visibility, and responsive layouts for animated pages.
- Verify that shop content does not display fabricated product facts or unsupported compatibility claims.
- Verify that quote UI communicates accurately whether an email draft was opened or a real request was submitted.
- CI must run lint, typecheck, tests, and production build before changes are eligible for merge.
- Include edge cases, invalid input, zero/negative values where meaningful, clipping, permission denial, unsupported APIs, and browser capability differences.

## Boundaries

### Always

- Follow the mandatory agent-skills workflow from `frvp6b8s5m-cloud/agent-skills`.
- Keep `main` deployable and work on the approved feature branch.
- Run the applicable verification suite before committing.
- Explain formulas, units, assumptions, and measurement limitations.
- Keep product facts and imagery accurate and authorized.
- Keep the shop and classified page visually impressive but simple to navigate.
- Keep all privileged operations inside GitHub.

### Ask first

- Any external service, backend, database, authentication, payment, analytics, or customer-data collection.
- A quote-request integration that transmits or stores customer data beyond a user-initiated local email handoff.
- New dependencies with material bundle/security impact.
- New tools outside the approved 30-tool scope.
- Domain/DNS changes, separate subdomain hosting, creation of another repository, repository visibility changes, production deployment, or merging to `main`.
- Any claim of direct mixer/console control or hardware compatibility beyond verified model-by-model support.
- Any change to the approved PROJECT: ORIGIN name or tagline.

### Never

- Commit secrets or privileged tokens.
- Claim browser microphone measurements are calibrated SPL without calibration.
- Expose privileged administration in client-side code.
- Manufacture or imply BZaudio-branded physical sound equipment.
- Invent product specifications, prices, stock, ratings, endorsements, compatibility, or photography rights.
- Claim a quote was submitted, stored, or received when the implementation cannot verify that outcome.
- Present theatrical classified styling as real security or government classification.
- Modify unrelated repositories or delete/overwrite existing unfinished tasks.

## Success criteria

### Shared site

- Navigation separates the toolbox, equipment shop, and PROJECT: ORIGIN clearly.
- The visual system is premium, responsive, accessible, performant, and not overwhelming.
- Reduced-motion users can access all content and functionality.

### Toolbox

- Existing 30-tool approved scope remains documented and implementation status remains truthful.
- Existing tool calculations and audio behaviors retain their tests and stated limitations.

### Shop and quote requests

- Customers can browse by manufacturer and equipment category.
- Product detail views show only verified product facts and authorized imagery.
- Product comparisons use comparable, sourced specifications.
- Quote requests have a clear, configurable destination and honest submission behavior.
- No checkout, payment, or customer account is introduced without separate approval.

### PROJECT: ORIGIN

- The approved name, tagline, and main headline appear exactly as specified.
- The page has a distinctive cinematic reveal and restricted-access visual language.
- The project remains mysterious without revealing unapproved technical details.
- The experience does not misrepresent security or collect credentials.

### Release quality

- Tests, lint, strict typecheck, and production build pass.
- Browser checks verify navigation, responsive behavior, keyboard use, and reduced motion.
- No secrets, unsupported claims, or fabricated product facts are present.
- Production deployment and merge to `main` remain separate approval gates.

## Repository visibility and release sequence

- `BZaudio-company` is public by explicit user authorization during the repository migration on 2026-11-10. Do not change visibility again without explicit approval.
- Public repository visibility does not authorize production deployment. GitHub Pages publication remains gated by the manual workflow and separate release approval.
- Verify current Pages eligibility, hosting configuration, and custom-domain requirements at release time.
- Do not change visibility, DNS, custom-domain settings, or publish production automatically.

## Open questions

1. **Domain and DNS:** Is `bzaudio.com` registered and under the user's DNS control, and which provider manages it? This is required before configuring `classified.bzaudio.com`.
2. **Subdomain hosting:** Should PROJECT: ORIGIN ultimately be served from a separate Pages site/repository or another approved hosting arrangement? The implementation plan must inspect the current GitHub Pages setup before deciding.
3. **Quote delivery:** With the current static-only architecture, should the first quote flow open a prefilled email to the configurable contact address, or should a backend/third-party form service be considered in a separately approved change?
4. **Catalog sourcing:** Which manufacturer feeds, authorized distributor data, or approved product lists will supply the first verified catalog? Do not scrape or publish product assets without checking their usage rights.
5. **Catalog pricing and inventory:** Should the initial catalog omit price/stock fields unless the user supplies verified data, or display only explicitly maintained quote-only product records?
6. **Initial product selection:** Which manufacturers and product families should form the first curated shop release? Existing brand compatibility priorities must not be mistaken for a complete authorized product catalog.

## Approval state

The user approved the capability map for TOOLBOX, SHOP, QUOTE, and ORIGIN on 2026-11-13. This document is the updated specification for review; it is **not yet approved for implementation**.

Per the agent-skills workflow, stop here and obtain explicit user approval or requested changes before creating a new implementation plan or writing code.
