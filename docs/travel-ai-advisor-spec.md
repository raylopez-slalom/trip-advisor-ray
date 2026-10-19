# Travel AI Advisor - Simple Product Specification

Status: Draft for product-owner review; not approved for implementation.
Version: 0.2
Requirement baseline: Project description supplied by the user.
Revision: Added technology recommendations at the user's request.
Human decision owners: Not yet assigned.

## 1. Purpose

Help travelers turn inspiration into a feasible trip plan by comparing
destinations, understanding trade-offs, and refining an itinerary without losing
their constraints.

This is a travel-planning assistant, not a booking platform. This document
defines product behavior and a proposed technology stack. It does not define
architecture, delivery dates, or a project budget.

## 2. Users and expected outcome

Intended users are travelers planning trips for themselves, couples, families,
or small groups.

Today, travelers must reconcile recommendations, costs, and practical details
across separate sources. The advisor should help them choose a destination and
leave with an inspectable daily plan, an estimated total cost, and a clear list
of assumptions and details still requiring verification.

Example trip brief:

> Two adults departing Chicago for five days in May, with a total budget of
> $2,500. Interested in food, nature, and walkable places. No rental car.

The advisor must clarify the year, travel-date flexibility, and what the budget
includes rather than assume them.

## 3. First-release scope

Included:

- An editable trip brief.
- Up to three destination options with costs, trade-offs, and sources.
- A day-by-day itinerary for the selected destination.
- Conversational refinement and structured editing controls.
- Whole-plan checks after each change.
- A small curated destination catalog with traceable planning estimates.

Not included:

- Reservations, payments, or ticket purchases.
- Guaranteed prices or confirmed availability.
- Live flight pricing or hotel inventory as a prerequisite.
- A map view.

A map and one live travel-data integration may be considered later. Neither is
a first-release commitment.

## 4. Main user flow and views

1. **Trip brief:** The user enters trip details. The advisor asks focused
   clarification questions and separates hard constraints from preferences.
2. **Destination comparison:** The user compares up to three suitable options
   and selects one.
3. **Itinerary workspace:** The user inspects a daily timeline and budget,
   requests changes, and sees the revised plan and change summary.

The current brief, budget, and itinerary must remain visible in structured
views. Users must not have to search conversation history to find them.

## 5. Functional requirements

### FR-1: Capture and clarify the trip brief

Capture:

- Departure city.
- Travel dates, or duration with timing and flexibility clarified as needed.
- Number of travelers, including adults and children where relevant.
- Total budget, currency, and included expense categories.
- Interests and preferred pace.
- Transportation preferences and restrictions.
- Optional accessibility and dietary preferences.

Show hard constraints separately from preferences and let users edit both.
For example, "no rental car" is a hard constraint; "near restaurants" can be a
preference. Ask when a statement is ambiguous. Do not silently interpret an
unclear budget as including or excluding flights.

### FR-2: Compare destinations

Present no more than three destination cards. Each card must show:

- Why the destination fits the brief.
- Estimated costs by category and an estimated total.
- Trade-offs, including preferences that cannot be fully met.
- Relevant weather and seasonality considerations, with sources.
- Source links and when the information was checked.
- Assumptions and uncertainties that need verification.

Recommend only options that meet known hard constraints. If fewer than three
qualify, show fewer rather than fill the list with unsuitable options.

### FR-3: Build an itinerary

For the selected destination, show:

- A day-by-day timeline covering the agreed duration.
- Activities grouped sensibly by location, allowing for travel time.
- Meal suggestions and free time appropriate to the requested pace.
- Transportation assumptions, including how the plan works without a car
  when required.
- An estimated budget with category totals.
- Relevant source links and unresolved practical details.

Do not present uncertain opening hours, travel times, prices, or accessibility
details as verified facts.

### FR-4: Refine and recheck

Support requests to lower the budget, slow the pace, replace an activity, add a
free afternoon, avoid a transportation mode, or change the traveler group.
Support changes through conversation and structured controls.

After every change:

1. Update the affected brief and itinerary details.
2. Recalculate the budget.
3. Recheck the whole plan against all current hard constraints, preferences,
   timing, transportation, and known practical limitations.
4. Identify any conflicts or new uncertainties.
5. Show a change summary, including relevant costs that changed or stayed the
   same.

Preserve constraints unless the user explicitly changes them. If a request
conflicts with an existing hard constraint, explain the conflict and ask which
requirement should change.

Example summary:

> Replaced two paid activities and added a free afternoon. Estimated activity
> costs decreased. Accommodation and transportation estimates are unchanged.

### FR-5: Explain infeasibility and missing information

If no supported plan meets the budget or another hard constraint, say so and
explain why. Offer explicit adjustments, such as changing dates, destination,
duration, or budget, without applying them without the user's agreement.

Never invent lower prices to make a plan fit. If information is missing or a
source cannot be checked, label the affected detail as unverified and explain
what the user needs to confirm.

## 6. Estimates, sources, and trust

- Use a curated catalog of a few destinations for the pilot.
- Use traceable sources for travel facts. AI-generated text alone is not
  evidence of prices, hours, availability, weather, or accessibility.
- Label all planning estimates with currency, cost basis, and scope, such as
  per person, per night, or total for the group.
- Account for the agreed budget categories and disclose excluded or unknown
  costs. Do not treat missing costs as zero or claim a complete budget fit
  while required costs are unknown.
- Show source-check dates and distinguish seasonal guidance from a forecast
  for specific travel dates.
- Display these distinctions wherever users assess a recommendation:
  an estimate is not a quote; a recommendation is not confirmed availability;
  an itinerary is not a reservation.

## 7. Usability and data considerations

- Make the current constraints, budget, assumptions, and unresolved warnings
  easy to inspect and edit.
- Keep optional accessibility and dietary details optional. Do not claim a
  venue meets a need without supporting information.
- Collect only information needed for planning. Passport details and payment
  information are not needed for this scope.
- Treat travel dates and optional personal needs as potentially sensitive.
  Data retention, sharing, and deletion rules require owner agreement before
  implementation.
- Confirm product accessibility requirements before implementation; travel
  accessibility preferences do not replace accessible product controls.

## 8. Acceptance criteria

These are proposed checks, not executed test results.

| ID | Scenario and expected result | Verification |
| --- | --- | --- |
| AC-1 | Given the example brief with an unclear budget scope, the advisor asks whether flights are included before claiming that a destination fits the budget. | Scenario walkthrough. |
| AC-2 | Given a no-rental-car constraint, destination options and the itinerary do not depend on a rental car. Any unresolved transportation feasibility is disclosed. | Inspect comparison and full itinerary. |
| AC-3 | Given qualifying catalog options, the comparison shows at most three cards, each containing fit, category costs, total, trade-offs, seasonality, sources, check dates, and uncertainties. | Inspect every displayed card. |
| AC-4 | Given a selected destination and agreed five-day duration, the itinerary covers five days and includes location-aware activities, travel time, meals, free time, transportation assumptions, costs, and sources. | Review timeline against the brief. |
| AC-5 | Given known costs, category amounts sum to the displayed total using the stated traveler count and duration. Unknown required costs remain visibly unknown. | Independently calculate a fixed-cost example. |
| AC-6 | When the user asks for a free afternoon or a slower second day, the revised timeline honors that request, preserves other constraints, and includes a change summary. | Compare the before and after plans. |
| AC-7 | When a child is added, the advisor clarifies any needed age information and rechecks the whole plan, including suitability, transport, accommodation assumptions, and costs. | Walk through a traveler-group change. |
| AC-8 | When a requested change conflicts with a hard constraint, the advisor explains the conflict and seeks clarification instead of silently dropping the constraint. | Exercise a conflicting-change scenario. |
| AC-9 | When no catalog option meets the budget, the advisor reports infeasibility and offers adjustments without fabricating prices or applying unapproved changes. | Use a budget below the known supported options. |
| AC-10 | When a required source detail is missing or cannot be checked, the affected fact is labeled unverified and the plan does not present it as confirmed. | Review an incomplete-source example. |
| AC-11 | After refinement, the current brief, budget, and itinerary are accessible outside the conversation, and estimates are not represented as quotes, availability, or reservations. | Walk through all three views. |

## 9. Recommended technology stack

These are recommendations for review, not approved implementation decisions.
Keep the pilot small: one language for application development, managed AWS
services, and GitHub for source control and checks. No architecture or
deployment topology is specified here.

### Application technologies

| Area | Recommendation | Reason |
| --- | --- | --- |
| Web interface | React with TypeScript and Vite | Suits the three interactive views without requiring server-side rendering. |
| Styling | Tailwind CSS | Supports consistent, responsive layouts with limited custom styling. |
| Server-side application code | Node.js on a currently AWS-supported LTS runtime, with TypeScript | Shares a language with the interface and supports travel-data and AI service calls. |
| Input and AI-output validation | Zod | Defines explicit shapes for briefs, destination cards, and itineraries; rejects invalid results. |
| Travel catalog | Versioned JSON files with source URLs, checked dates, cost basis, and uncertainty fields | Keeps a small curated catalog easy to inspect and review without a database. |
| Automated checks | TypeScript checks, ESLint, Vitest, React Testing Library, and Playwright | Covers types, calculations, constraint rules, components, and the complete planning flow. |

Budget calculations and constraint checks must use deterministic application
code, not model-generated arithmetic. Validate model output before displaying
it as the current plan; show an explicit error if a valid result cannot be
produced. Keep the previous valid plan intact.

### AWS services

| Need | Recommendation | Pilot boundary |
| --- | --- | --- |
| Web hosting | AWS Amplify Hosting | Managed React hosting with HTTPS and GitHub integration. |
| Server-side execution | AWS Lambda and Amazon API Gateway | Managed execution and API endpoints without maintaining servers; confirm model-response latency fits configured request limits. |
| Product AI capability | Amazon Bedrock, using the AWS SDK for JavaScript | Evaluate an available model against the acceptance scenarios before choosing it. Confirm region, model access, data handling, latency, and cost. |
| Monitoring | Amazon CloudWatch | Record operational errors and usage without logging complete conversations or optional sensitive trip details by default. |
| Cost visibility | AWS Budgets | Set owner-approved alerts; alerts alone do not cap spend. Add request, concurrency, and AI-usage limits before exposing the pilot. |
| Resource configuration | AWS CDK with TypeScript | Keep repeatable AWS configuration in source control rather than relying on undocumented manual changes. |

Bedrock is a proposed runtime capability for the travel product, not a
replacement for GitHub Copilot as the project's AI-assisted development tool.
Its use requires owner approval and review of organizational AI and data rules.
Do not send private project records or credentials to a model.

Do not add a database or user-account service just to complete this list.
If saved plans are approved, consider Amazon DynamoDB. If user accounts are
approved, consider Amazon Cognito and define access and deletion rules before
storing personal plans. Neither capability is included in the current scope.

### GitHub tools and working practices

- **GitHub repository:** Keep application code, the curated catalog,
  specifications, and AWS configuration together. Use a private repository
  unless the owner approves publication.
- **Pull requests:** Require human review and passing checks before merging.
  Protect the main branch using repository rules supported by the chosen plan.
- **GitHub Actions:** Run type checks, linting, unit/component tests, a
  production build, and end-to-end acceptance scenarios. Retain results as
  evidence; AI review is not a substitute for executing tests.
- **AWS deployment access:** Use GitHub Actions OIDC with narrowly scoped IAM
  roles instead of long-lived AWS access keys. Restrict trust to the approved
  repository and branch or environment. Deployment remains separately
  authorized; adding these recommendations does not deploy anything.
- **GitHub Issues and Projects:** Track pilot work and acceptance criteria.
  Keep Jira unconfigured unless the owner requests it.
- **Dependabot and GitHub Copilot:** Use Dependabot for dependency-update pull
  requests and Copilot for development assistance, subject to human review.

Before implementation, agree the AWS region, access controls for pilot users,
cost limits, deployment approvals, and exact supported dependency versions.
Do not expose a paid AI endpoint without appropriate access and abuse controls.
Do not add maps, booking APIs, a vector database, or an agent framework unless
an approved requirement demonstrates a need.

### Reference documentation

Service capabilities were checked on October 19, 2026. Availability, pricing,
and organizational access must be confirmed before implementation.

- [AWS Amplify Hosting](https://docs.aws.amazon.com/amplify/latest/userguide/welcome.html)
- [Amazon Bedrock overview](https://docs.aws.amazon.com/bedrock/latest/userguide/what-is-bedrock.html)
- [GitHub Actions OIDC for AWS](https://docs.github.com/en/actions/how-tos/secure-your-work/security-harden-deployments/oidc-in-aws)

## 10. Open decisions and readiness

Confirmed scope comes from the supplied project description. The intended
benefit is better travel decisions under constraints; no numerical success
target, pilot catalog, or delivery commitment has been approved.

| Open decision | Responsible role, person not yet assigned |
| --- | --- |
| Which destinations, departure regions, currencies, and trip lengths will the pilot support? | Product owner |
| Which sources are permitted, and how recent must each kind of information be? | Product owner with technical owner |
| Must users save or share plans, and are accounts needed? These capabilities are not committed in this draft. | Product owner |
| What retention, deletion, sharing, and product accessibility requirements apply? | Product owner with technical and QA owners |
| What measurable pilot success target and acceptance process will be used? | Product owner with QA owner |
| Who owns product decisions, delivery, technical decisions, QA, and final acceptance? | Project sponsor |
| Is the proposed stack approved, including Bedrock use, AWS region, pilot access controls, cost limits, and deployment permissions? | Product owner with technical and delivery owners |

Proposed intake decision: Continue clarification and review this draft.
Approval remains pending. Implementation readiness is blocked until owners,
scope boundaries, source rules, acceptance criteria, and validation checks are
agreed. The project remains in the idea phase.
