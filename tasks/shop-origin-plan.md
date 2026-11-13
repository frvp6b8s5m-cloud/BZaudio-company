# Implementation Plan: BZaudio Shop + PROJECT ORIGIN

## Status
Planning draft created after approval of the updated SPEC.md. This document does not authorize implementation, merging to main, DNS changes, or production deployment. Existing Release 1 toolbox and release-hardening plans remain unchanged.

## Objective
Extend the existing BZaudio React + TypeScript + Vite static site with two independently testable experiences:
1. A premium equipment showroom for established audio manufacturers, with product discovery and quote requests.
2. A cinematic classified project experience for PROJECT: ORIGIN.

## Architecture and constraints
- Preserve the existing React, TypeScript, Vite, GitHub Actions, and GitHub Pages architecture unless a reviewed technical change is required.
- Static-first implementation. Do not introduce a backend, customer accounts, payments, or privileged client-side administration as part of this scope.
- Keep product catalogue content in typed local data initially. Only publish products with verified model names, specifications, and appropriately licensed/authorized imagery.
- Product pricing and stock are not assumed. Present quote requests rather than checkout or unverified availability.
- Quote submission must not pretend to send or store a request until a real, configured destination and working delivery mechanism exist. Until then, show an explicit non-submitting/configuration state or use an approved external contact destination.
- Keep the BZaudio-owned product line focused on software and technology. The shop may list third-party physical audio equipment.
- PROJECT: ORIGIN identity is fixed:
  - Name: PROJECT: ORIGIN
  - Tagline: “Where the next era of audio begins.”
  - Main message: “THE FUTURE OF LIVE AUDIO IS UNDER DEVELOPMENT.”
- The classified presentation is theatrical branding, not a claim of government classification, real security clearance, or secure access control.
- Build the classified experience as an in-site route first (for example, /classified). A dedicated classified.bzaudio.com host is deferred until domain ownership, DNS control, and static-host routing are verified.
- Use responsive layouts, keyboard access, visible focus, semantic markup, reduced-motion support, and performant animation.
- Do not use unlicensed photography, fabricate technical claims, or imply manufacturer endorsement.

## Capability map and delivery order

### Workstream A — Shared navigation and information architecture
- Define primary navigation for Toolbox, Shop, PROJECT: ORIGIN, About, and contact/quote entry points.
- Preserve existing toolbox navigation and all current tool behavior.
- Ensure new routes work with GitHub Pages base-path and deep-link constraints.

### Workstream B — Shop foundation
- Add shop landing page with clear departments and manufacturer browsing.
- Add typed product catalogue model and product data validation.
- Add category and manufacturer filters, search, and useful empty states.
- Add product detail pages with verified specifications, image gallery, documents/links where authorized, related products, and quote action.
- Add comparison only for products with comparable, sourced specifications.
- Initial departments: mixing consoles; speakers and PA; microphones; processors and effects; stage and signal equipment; accessories.
- Initial brand candidates include Allen & Heath, Yamaha, Shure, and JBL. Include only models with verified product data and approved imagery.
- No checkout, payment, inventory promises, or unsupported compatibility claims.

### Workstream C — Quote-request flow
- Define product-aware quote request UI and validation.
- Keep contact destination configurable and out of hard-coded UI copy.
- Decide and verify the delivery mechanism before enabling submission.
- Provide accessible success, failure, loading, and unavailable states.
- Do not collect unnecessary personal data.

### Workstream D — PROJECT: ORIGIN
- Add a dedicated classified-style route with the approved project name and exact tagline/message.
- Create a restrained, cinematic visual system: dark secure-facility atmosphere, layered depth, restrained signal graphics, scan/reveal motion, redacted information, and a clear restricted-access presentation.
- Keep project details intentionally undisclosed; do not invent technical capabilities or milestones.
- Add optional interactive access panel only as theatrical UI; it must not imply actual authentication or expose secrets.
- Respect reduced-motion settings and maintain usability on mobile and keyboard-only navigation.

### Workstream E — Quality and release readiness
- Add unit/component and Playwright coverage for navigation, shop filters, product details, quote states, and PROJECT: ORIGIN.
- Verify desktop, tablet, mobile, minimum viewport, keyboard navigation, accessibility basics, and reduced-motion behavior.
- Run lint, typecheck, unit tests, browser tests, production build, and dependency audit.
- Keep deployment manual and gated. No merge to main or production publish without separate explicit approval.

## Dependencies and open decisions
1. Product catalogue source: identify exact launch models and authoritative manufacturer sources; no model list is assumed complete.
2. Product imagery: confirm licensed/manufacturer-authorized assets and permitted usage.
3. Quote delivery: confirm contact email and an actual supported submission path. Email address remains configurable.
4. Domain: confirm registered domain and DNS control before creating a real subdomain. Until then use an in-site route.
5. Shop commercial details: confirm whether pricing is quote-only for all items at launch; default is quote-only.
6. Product documents: include only links/files that may legally be redistributed or linked.

## Risks and mitigations
| Risk | Impact | Mitigation |
|---|---|---|
| Static hosting cannot securely process quote submissions by itself | High | Do not fake submissions; select and review a real delivery mechanism before enabling |
| Unverified product specs or compatibility | High | Use authoritative sources, cite internal source URLs in catalogue data, and omit uncertain fields |
| Image licensing restrictions | High | Use authorized manufacturer/partner assets or licensed photography |
| Domain/DNS not confirmed | Medium | Ship an in-site route first; defer subdomain |
| Motion harms usability/performance | Medium | Reduced-motion support, restrained effects, responsive/performance testing |
| Shop scope grows too large | Medium | Launch with a small verified catalogue and expand in batches |

## Definition of done
- Existing toolbox workflows continue to pass all existing tests.
- Shop navigation, filtering, product detail, comparison, and quote states work as specified.
- Every published product claim and image has a traceable approved source.
- PROJECT: ORIGIN uses the approved exact copy and does not disclose invented project details.
- Responsive, keyboard, reduced-motion, and automated quality checks pass.
- No production deployment, merge, DNS change, or external service is performed without its own approval.
