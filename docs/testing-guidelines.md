# Testing Guidelines

## Testing philosophy

The core of this product is an AI model that interprets preferences and generates plans. That output cannot be unit-tested for correctness in the traditional sense. Testing focuses on:

1. **Application logic** (deterministic) — fully unit-tested
2. **AI output structure** (schema, completeness) — validated with Zod; integration-tested with recorded fixtures
3. **Constraint enforcement** (critical invariants) — scenario-tested end-to-end
4. **Acceptance criteria** — mapped directly to AC-1 through AC-11 from the product specification

The AI model's recommendation quality is evaluated through scenario reviews and human judgment, not automated assertion. AI review is not a substitute for executing tests; CI must run and retain results.

---

## Tooling

| Layer | Tool |
|-------|------|
| Unit and component tests | Vitest + React Testing Library |
| End-to-end / acceptance tests | Playwright |
| Schema validation | Zod (runtime, in application code) |
| AI response fixtures | Recorded JSON fixtures (VCR pattern) — no live model calls in CI |
| Type checking | TypeScript (`tsc --noEmit`) |
| Linting | ESLint |

All checks — type checking, linting, unit/component tests, production build, and end-to-end acceptance scenarios — run in GitHub Actions on every pull request. Results are retained as evidence.

---

## Test layers

### 1. Unit tests — application logic (Vitest)

Test every deterministic function independently.

**Budget calculation**
- Total equals the sum of all cost lines in the plan
- A plan over the budget ceiling throws a validation error — the budget ceiling is never silently exceeded
- Mixed currencies raise an error, not a silent conversion
- Unknown required costs are flagged as unknown — not treated as zero or omitted

**Constraint classification**
- "no rental car" → hard constraint
- "hotel near restaurants" → preference
- Ambiguous statements → `needs-clarification`, not silently decided

**Change diffing**
- Adding an activity produces a diff entry with `added`
- Removing produces `removed`; replacing produces both `removed` and `added`
- Budget delta is calculated correctly from the diff
- Costs that are unchanged are included in the change summary alongside changed ones

**Constraint validation**
- Plan including a rental car when `no-rental-car` is a constraint → fails validation
- Plan running 6 days when `fixed-duration = 5` → fails validation
- Plan within budget → passes validation
- Plan over budget by any amount → fails validation
- Constraint is preserved after refinement unless the user explicitly changed it

**Zod schema validation**
- Valid destination proposal response → parses without error
- Missing `whyItFits` field → Zod parse throws; error is caught and user-visible error returned
- Missing `sources` array → same
- Invalid `estimateLow > estimateHigh` → schema rejects it

**Source freshness**
- Source with `dateChecked` older than 90 days → `isStale: true`
- Source with no `dateChecked` → treated as stale
- Fresh source → `isStale: false`

---

### 2. Component tests — UI (React Testing Library + Vitest)

Test component rendering and interaction, not layout or visual appearance.

**Trip Brief form**
- Required fields not filled → submit is disabled or shows validation messages
- Budget entered without selecting inclusions → "Does this include flights?" helper appears
- Constraint chip renders as red; preference chip renders as blue
- Editing a field after submission shows recalculation warning

**Destination card**
- Cost breakdown renders all categories with estimate badges
- Stale source (> 90 days) shows warning icon
- "No destination fits" state renders explanation and adjustment options, not an empty list
- Excluded cost categories are shown as unknown, not omitted

**Itinerary Workspace**
- Budget summary shows total vs. ceiling and category breakdown
- Unverified detail shows label, not a bare fact
- Change summary banner appears after refinement with both changed and unchanged cost lines
- API error state shows explicit error message and does not clear the previous plan

---

### 3. End-to-end / acceptance tests (Playwright)

These map directly to the acceptance criteria in the product specification.

#### AC-1 — Budget clarification before proposal
**Scenario**: the example brief with an unclear budget scope  
**Steps**: enter trip brief with `budget.clarified = false`; submit  
**Expected**: advisor asks whether flights are included before proposing any destination  
**Failure**: advisor proposes destinations before clarifying the budget

#### AC-2 — No-rental-car constraint enforced
**Scenario**: no-rental-car constraint present  
**Steps**: complete trip brief with "no rental car"; review destination cards and full itinerary  
**Expected**: no option or activity depends on a rental car; any unresolved transportation feasibility is disclosed  
**Failure**: a destination card or itinerary activity assumes a car

#### AC-3 — Destination card completeness
**Scenario**: catalog has qualifying options  
**Steps**: complete a valid trip brief; view destination comparison  
**Expected**: at most three cards; each card shows fit rationale, category costs, total, trade-offs, seasonality with source, source check dates, and uncertainties  
**Failure**: any of those elements is missing from a card, or more than three cards appear

#### AC-4 — Itinerary completeness
**Scenario**: five-day trip brief selected  
**Steps**: select a destination; view itinerary  
**Expected**: five days, each with location-aware activities, travel time accounted for, meal suggestions, free time, transportation assumptions, costs, and sources  
**Failure**: fewer or more than five days, or any required element missing

#### AC-5 — Budget arithmetic
**Scenario**: all cost categories are known  
**Steps**: select a destination with a fully sourced catalog entry; view budget summary  
**Expected**: category amounts sum to the displayed total using the stated traveler count and duration; unknown required costs remain visibly unknown  
**Failure**: displayed total does not match the sum of category lines, or an unknown cost is treated as zero

#### AC-6 — Refinement honors request and preserves constraints
**Scenario**: user asks for a free afternoon or a slower second day  
**Steps**: from a valid itinerary, request "add a free afternoon on day 3" or "make day 2 less busy"  
**Expected**: revised timeline honors the request; all hard constraints are preserved; change summary is present  
**Failure**: constraint is dropped, request is ignored, or no change summary appears

#### AC-7 — Adding a child rechecks the whole plan
**Scenario**: adults-only plan, user adds a child mid-session  
**Steps**: from a valid itinerary, update traveler count to include a child  
**Expected**: advisor clarifies any needed age information; rechecks suitability, transport, accommodation, and costs for the whole plan  
**Failure**: plan is not rechecked, or child addition is applied without clarification

#### AC-8 — Conflicting change raises conflict, not a silent drop
**Scenario**: user requests a change that conflicts with a hard constraint  
**Steps**: from an itinerary with "no rental car", request "add a day trip that requires driving"  
**Expected**: advisor explains the conflict and asks which requirement should change; constraint is not silently dropped  
**Failure**: constraint is dropped, or the conflicting change is applied without explanation

#### AC-9 — Infeasibility reported honestly
**Scenario**: budget below what any catalog option supports  
**Steps**: enter a trip brief with a budget below the floor of all catalog entries  
**Expected**: advisor reports infeasibility, explains why, and offers adjustments (date change, destination, duration, budget increase) without applying them  
**Failure**: advisor returns a plan with fabricated lower prices, or applies adjustments without user agreement

#### AC-10 — Missing source details labeled unverified
**Scenario**: a catalog entry has an incomplete or uncheckable source for a fact  
**Steps**: view a destination card or itinerary activity that references an incomplete source  
**Expected**: the affected fact is labeled "unverified"; the plan does not present it as confirmed  
**Failure**: the fact is shown without a caveat, or the unverified label is missing

#### AC-11 — Brief, budget, and itinerary accessible outside conversation
**Scenario**: user has completed a trip and refinements  
**Steps**: walk through all three views after several refinements  
**Expected**: current brief, budget, and itinerary are accessible in structured views; costs are labeled as estimates, not quotes, confirmed availability, or reservations  
**Failure**: user must search conversation history to find current values, or costs appear without estimate labeling

---

### 4. Regression / golden-file tests

For a small set of canonical trip briefs, record the expected JSON structure and check for regressions when the model, prompts, or application logic change.

**Canonical scenarios**:
1. Chicago, 5 days, $2,500, two adults, food + nature, no rental car
2. NYC, 3 days, $1,200, one adult, culture + nightlife, public transit only
3. Chicago, 5 days, $800, one adult — budget that no catalog destination supports (AC-9)
4. Chicago, 5 days, $2,500, two adults; add a child after the itinerary is built (AC-7)

For each: record the response JSON structure. On model or prompt update, a human reviews diffs before merging.

---

## What not to automate

Do not write automated assertions on:
- The specific destinations proposed (a valid update may surface better options)
- The exact wording of rationale or trade-off text
- The specific activities in a day (content quality is a human judgment)
- Whether one destination is "better" than another

These are evaluated through scenario reviews, not CI gates.

---

## Manual scenario review checklist

Run before any release that changes the AI prompt, model version, or constraint logic. Each item maps to an acceptance criterion.

- [ ] **AC-1** Budget clarification: unclear budget prompts a question before destination proposals
- [ ] **AC-2** No-rental-car: no car assumed anywhere in destinations or itinerary; unresolved transport disclosed
- [ ] **AC-3** Destination cards: at most three; each has all required sections
- [ ] **AC-4** Itinerary: correct duration; all required elements present per day
- [ ] **AC-5** Budget arithmetic: category totals sum correctly; unknown costs shown as unknown
- [ ] **AC-6** Refinement: request honored, constraints preserved, change summary present
- [ ] **AC-7** Add child: age clarified, whole plan rechecked
- [ ] **AC-8** Conflicting change: conflict explained, constraint not silently dropped
- [ ] **AC-9** Infeasibility: no fabricated prices; adjustments offered but not applied
- [ ] **AC-10** Unverified source: affected facts labeled, not presented as confirmed
- [ ] **AC-11** Structured views: brief, budget, itinerary accessible outside conversation; estimates labeled correctly
