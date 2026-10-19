# Implementation Plan

Status: Draft — not approved for implementation.
Version: 0.1
Owners: Not yet assigned (see `docs/travel-ai-advisor-spec.md` §10)

---

## Guiding principles

- Phases 1 and 2 have zero AI dependency — complete and merge them before Bedrock access is confirmed
- Each phase produces a working, deployable increment — no phase ends with broken or half-wired code
- Budget arithmetic and constraint checks are always deterministic application code; the AI model never does arithmetic
- All Bedrock responses are Zod-validated before reaching the UI; on failure, return an explicit error and preserve the previous valid plan
- Run `/feature-start` before coding any task; run `/spec-check` and `/code-review` before opening a PR

---

## Phase 1 — Project scaffold

**Goal**: a deployable "hello world" across all three packages, with CI running on every PR.

No AI or travel-data dependency. Everything here is pure infrastructure and tooling.

| # | Task | Notes |
|---|------|-------|
| 1.1 | Initialize monorepo (`packages/web`, `packages/api`, `packages/infra`) | Use npm workspaces or pnpm |
| 1.2 | Set up Vite + React + TypeScript + Tailwind in `packages/web` | React 18, strict TS config |
| 1.3 | Set up Node.js + TypeScript for Lambda in `packages/api` | ESM, strict TS, esbuild for bundling |
| 1.4 | Set up AWS CDK (TypeScript) in `packages/infra` | CDK v2 |
| 1.5 | Configure ESLint + strict TypeScript across all packages | Shared config at repo root |
| 1.6 | Configure Vitest + React Testing Library in `packages/web` | |
| 1.7 | Configure Playwright for end-to-end tests | Separate `packages/e2e` or `e2e/` directory |
| 1.8 | GitHub Actions CI: type check, lint, Vitest, build on every PR | Retain results as evidence |
| 1.9 | GitHub Actions CD: deploy to Amplify + Lambda via OIDC on merge to main | Scoped IAM roles, no long-lived keys |

**Done when**: a "hello world" React page deploys to Amplify; a Lambda returns a health-check response through API Gateway; CI is green on a test PR.

---

## Phase 2 — Data model and catalog

**Goal**: shared TypeScript types, Zod schemas, and a working JSON catalog for 3–5 destinations.

No AI dependency. The catalog unblocks all subsequent phases.

| # | Task | Notes |
|---|------|-------|
| 2.1 | Define TypeScript interfaces in a shared package (`packages/shared`) | Based on `docs/data-model.md`: `TripBrief`, `Constraint`, `Destination`, `CostLine`, `Source`, `Itinerary`, `Day`, `ChangeSnapshot` |
| 2.2 | Define Zod schemas for all types | One schema per interface; schemas are the runtime source of truth |
| 2.3 | Build JSON catalog: 3–5 destinations | Each entry: cost ranges, source URLs, check dates, seasonal notes, uncertainty fields — per `docs/data-model.md` catalog schema |
| 2.4 | Write catalog loader utility with stale-data detection | Flag sources with `dateChecked` > 90 days as `isStale: true` |
| 2.5 | Unit tests: Zod schema parse/reject, stale-data detection | |

**Done when**: all types compile, schemas reject invalid inputs, catalog loads and stale sources are flagged correctly.

---

## Phase 3 — Trip Brief (View 1)

**Goal**: users can fill in a trip brief, see their inputs classified as constraints or preferences, and be prompted to clarify an ambiguous budget.

No AI dependency.

| # | Task | Notes |
|---|------|-------|
| 3.1 | Build `TripBriefForm` component | All required and optional fields from `docs/ui-guidelines.md` |
| 3.2 | Build constraint/preference classifier | "no rental car" → hard constraint; "hotel near restaurants" → preference |
| 3.3 | Build `ConstraintChip` (red) and `PreferenceChip` (blue) components | Color + icon — never color alone |
| 3.4 | Budget clarification prompt | "Does this include flights?" — Yes / No / Unsure; block proceed on Unsure until clarified |
| 3.5 | Zod validation on form submit | Show inline field errors; disable submit until required fields pass |
| 3.6 | Unit tests: classifier, budget clarification logic | Cover edge cases: ambiguous statements, missing required fields |
| 3.7 | Component tests: form validation, chip rendering | React Testing Library |

**Done when**: AC-1 (budget clarification before proceeding) passes manually; constraint chips render correctly; form rejects missing required fields.

---

## Phase 4 — Destination comparison (View 2)

**Goal**: users see up to three destination cards with cost breakdowns, trade-offs, and sources after submitting the trip brief.

First phase with AI (Bedrock) and live catalog data.

| # | Task | Notes |
|---|------|-------|
| 4.1 | Lambda handler: destination proposals endpoint | Receives `TripBrief` + `Constraint[]`; queries catalog; calls Bedrock |
| 4.2 | Bedrock integration | AWS SDK for JavaScript; system prompt from `docs/ai-prompt-guidelines.md` |
| 4.3 | Output schema + Zod validation | Validate every Bedrock response before returning to UI; structured error on parse failure |
| 4.4 | Constraint validation: block proposals that violate hard constraints | No options depending on a car when `no-rental-car` is active |
| 4.5 | Budget fit check: flag proposals over budget | `budgetFitsConstraint`, `budgetDelta` fields on each `Destination` |
| 4.6 | `DestinationCard` component | Fit rationale, cost breakdown, trade-offs, weather, sources, uncertainties |
| 4.7 | `EstimateBadge` component | Source name + date checked on hover/tap |
| 4.8 | `SourceDisclosure` collapsible component | All sources with URLs and dates |
| 4.9 | Stale data warning icon | Source `isStale: true` → warning icon with tooltip |
| 4.10 | Budget status indicator | "Fits budget" or "Exceeds by ~$X — adjustments needed" |
| 4.11 | No-match / infeasibility state | Explain why; offer adjustments; never show an empty list |
| 4.12 | Unit tests: Lambda handler, constraint validation, budget fit check | Use recorded Bedrock response fixtures (VCR pattern) — no live calls in CI |
| 4.13 | Component tests: `DestinationCard`, `EstimateBadge`, no-match state | |
| 4.14 | Playwright: AC-1, AC-2, AC-3 | Budget clarification, no-rental-car, card completeness |

**Done when**: AC-1, AC-2, AC-3 pass; stale data is flagged; infeasible budgets show an honest explanation.

---

## Phase 5 — Itinerary workspace (View 3)

**Goal**: users get a day-by-day itinerary, can refine it conversationally, and see a change summary after every change.

Most complex phase. Depends on Phase 4 being stable.

| # | Task | Notes |
|---|------|-------|
| 5.1 | Lambda handler: itinerary generation endpoint | Receives selected `Destination` + `TripBrief` + `Constraint[]`; calls Bedrock |
| 5.2 | Itinerary prompt + Zod output schema | From `docs/ai-prompt-guidelines.md`; validate structure before returning |
| 5.3 | `ItineraryTimeline` component | Day cards with morning/afternoon/evening sections; activities, meals, free periods, transit notes |
| 5.4 | `UnverifiedLabel` component | Facts without a confirmed source are labeled — never presented as confirmed |
| 5.5 | `BudgetSummary` panel | Category breakdown, total vs. ceiling, unknown costs shown as unknown (not zero) |
| 5.6 | Lambda handler: refinement endpoint | Receives current itinerary snapshot + change request + constraints; returns revised plan |
| 5.7 | Change diffing logic | Added / removed / modified activities; budget delta; include unchanged costs in summary |
| 5.8 | Full plan constraint recheck after every refinement | Recheck the whole plan — not just the changed section |
| 5.9 | Conflict detection | Requested change violates a hard constraint → explain conflict, ask which requirement changes; do not silently drop the constraint |
| 5.10 | `ChangeSummaryBanner` component | Shows changed and unchanged cost lines after each refinement |
| 5.11 | `RefinementPanel` component | Freeform text input + structured controls (lower budget, swap activity, change pace) |
| 5.12 | Error state | API failure → explicit error message; preserve previous valid plan |
| 5.13 | Unit tests: diff logic, budget recalculation, constraint recheck, conflict detection | |
| 5.14 | Component tests: timeline, budget summary, change banner, error state | |
| 5.15 | Playwright: AC-4 through AC-11 | Full acceptance criteria coverage — see `docs/testing-guidelines.md` |

**Done when**: all AC-4–AC-11 pass; change summaries include unchanged costs; constraint conflicts are explained, not silently dropped; error state preserves the previous plan.

---

## Phase 6 — Navigation and cross-cutting

**Goal**: the three views feel like a connected product; the app is accessible and responsive.

| # | Task | Notes |
|---|------|-------|
| 6.1 | Step indicator nav (Trip Brief → Destinations → Itinerary) | Always visible; shows current step |
| 6.2 | Constraint strip above Itinerary Workspace | Hard constraints and preferences persist visibly throughout the session |
| 6.3 | Responsive layout | Mobile / tablet / desktop breakpoints from `docs/ui-guidelines.md` |
| 6.4 | Accessible markup | Keyboard navigation, ARIA labels on badges, WCAG AA contrast ratios, date picker text fallback |
| 6.5 | AC-11 Playwright check | Brief, budget, and itinerary accessible in structured views outside conversation history |

**Done when**: AC-11 passes; layout works at all three breakpoints; keyboard navigation reaches all interactive elements.

---

## Phase 7 — Infrastructure (CDK)

**Goal**: all AWS resources are defined in CDK, deployed through CI, and monitored.

Can be started in parallel with Phase 3 once Phase 1 is stable.

| # | Task | Notes |
|---|------|-------|
| 7.1 | CDK stack: Amplify Hosting | React app, HTTPS, GitHub integration |
| 7.2 | CDK stack: Lambda + API Gateway | Endpoints for proposals, itinerary, refinement |
| 7.3 | CDK stack: CloudWatch logging | No full conversations or optional sensitive trip details logged by default |
| 7.4 | CDK stack: AWS Budgets alert | Owner-approved threshold; alerts alone do not cap spend — add request and concurrency limits before pilot exposure |
| 7.5 | GitHub Actions OIDC + IAM roles | Trust scoped to approved repository and branch; no long-lived keys |
| 7.6 | Confirm Bedrock model, region, and access | Owner approval required before any Bedrock call in production |

**Done when**: all resources deploy via CDK; CI/CD pipeline is green end-to-end; no manual AWS console changes required.

---

## Open decisions blocking implementation

These must be resolved before the relevant phase starts. From `docs/travel-ai-advisor-spec.md` §10:

| Decision | Blocks | Owner |
|----------|--------|-------|
| Which destinations, departure regions, and trip lengths the pilot supports | Phase 2 (catalog) | Product owner |
| Which sources are permitted and how recent each must be | Phase 2 (catalog) | Product owner + technical owner |
| Bedrock model, region, data handling, latency, and cost approved | Phase 4 (Bedrock calls) | Product owner + technical owner |
| Data retention, deletion, and sharing rules | Phase 7 (CloudWatch config) | Product owner + technical owner |
| Pilot access controls and cost limits | Phase 7 (Budgets, IAM) | Product owner + technical owner |
| Measurable pilot success target and acceptance process | Pre-launch | Product owner + QA owner |

---

## Reference documents

| Document | Purpose |
|----------|---------|
| `docs/travel-ai-advisor-spec.md` | Authoritative product specification and acceptance criteria (AC-1–AC-11) |
| `docs/architecture-specs.md` | Three-layer architecture, AWS stack, data flows |
| `docs/ui-guidelines.md` | Three-view layout, component patterns, copy guidelines |
| `docs/testing-guidelines.md` | AC-1–AC-11 Playwright scenarios, unit test coverage, what not to automate |
| `docs/ai-prompt-guidelines.md` | System prompt template, output schemas, prompt versioning |
| `docs/data-model.md` | TypeScript interfaces and catalog schema |
| `docs/adr/001-ai-data-separation.md` | Why the AI model never supplies travel facts |
