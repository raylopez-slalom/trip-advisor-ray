# Travel AI Advisor

## Project overview

A conversational travel-planning assistant that turns a trip idea into a feasible, constraint-aware itinerary. Users describe their trip (departure city, dates, budget, traveler count, interests, pace, transportation preferences) and the advisor proposes up to three destinations with cost breakdowns and trade-offs, then builds a refineable day-by-day itinerary. The core value is decision support under real constraints — not generating travel descriptions. Hard constraints are never silently violated. All costs are labeled as estimates with sources and check dates. If no plan fits the budget, the advisor says so and offers adjustments; it never invents lower prices.

This is a planning assistant, not a booking platform. An estimate is not a quote. A recommendation is not confirmed availability. An itinerary is not a reservation.

## Tech stack

- **Frontend**: React + TypeScript + Vite, styled with Tailwind CSS
- **Backend**: Node.js (AWS-supported LTS) + TypeScript, deployed on AWS Lambda + API Gateway
- **AI runtime**: Amazon Bedrock via AWS SDK for JavaScript — requires owner approval before use; confirm model, region, data handling, latency, and cost
- **Validation**: Zod — all API inputs and all Bedrock output are validated before use
- **Travel catalog**: Versioned JSON files with source URLs, checked dates, cost basis, and uncertainty fields (no database in pilot)
- **Infrastructure**: AWS CDK (TypeScript), AWS Amplify Hosting, CloudWatch, AWS Budgets
- **CI/CD**: GitHub Actions with OIDC + scoped IAM roles (no long-lived AWS keys)
- **Testing**: Vitest + React Testing Library (unit/component), Playwright (end-to-end)

## Architecture

Three layers with strict separation — no layer does the work of another:

```
React UI (Amplify)
  └─► Lambda + API Gateway
        ├─► Amazon Bedrock   — interprets preferences, proposes options, generates itinerary structure
        └─► JSON catalog     — supplies travel facts (prices, hours, seasonality) with sources
```

**The AI model never supplies prices, availability, or hours.** Those come from the JSON catalog. Budget arithmetic is deterministic application code, not model output. All Bedrock responses are Zod-validated before reaching the UI. On a validation failure, the API returns an explicit error and preserves the previous valid plan.

See `docs/architecture-specs.md` for data flow diagrams and the full AWS stack.

## Key directories

```
docs/
  product-requirements.md   Core flows, constraint vs. preference rules, non-negotiables
  architecture-specs.md     Three-layer diagram, data flows, AWS stack, pilot constraints
  ui-guidelines.md          Three-view layout, component patterns, copy guidelines
  testing-guidelines.md     AC-1–AC-11 acceptance scenarios, tooling, what not to automate
  ai-prompt-guidelines.md   System prompt template, output schemas, prompt versioning
  data-model.md             TypeScript interfaces for all plan state and catalog types
  implementation-plan.md    Phased task list (7 phases, ~60 tasks) with done criteria
  travel-ai-advisor-spec.md Authoritative product specification (v0.2, draft)
  adr/                      Architectural decision records

scripts/
  triage_agent.py           CI/CD triage agent (Python, Anthropic SDK) — dev tooling only
  hooks/                    Git hooks
  setup-hooks.sh            Installs git hooks

templates/                  Blank templates for CLAUDE.md, PRs, CI, MCP config
.claude/skills/             Project-specific slash commands
```

## Conventions

**Naming**
- React components: PascalCase (`TripBriefForm`, `DestinationCard`)
- Functions and variables: camelCase
- Zod schemas: PascalCase with `Schema` suffix (`TripBriefSchema`, `ItinerarySchema`)
- TypeScript types/interfaces: PascalCase (`TripBrief`, `Constraint`, `CostLine`)
- Constants: `SCREAMING_SNAKE`
- API routes: kebab-case, noun-based (`/trip-brief`, `/destination-proposals`, `/itinerary`)
- JSON catalog files: kebab-case (`catalog/destinations.json`)

**Patterns to follow**
- Validate all Bedrock output with Zod before returning it to the UI — never pass raw model output through
- Budget totals and constraint checks use deterministic application code; the AI model does not do arithmetic
- The UI never calls Bedrock directly — all AI calls go through Lambda
- On any validation failure or constraint violation, return a structured error and keep the previous valid plan intact
- All travel facts displayed in the UI carry a source label and `dateChecked`; facts > 90 days old show a stale warning
- Hard constraints are preserved across refinements unless the user explicitly changes them; if a requested change conflicts with a constraint, explain the conflict and ask which requirement should change
- Show a change summary after every refinement — including costs that stayed the same, not just those that changed
- Unknown or unverifiable facts are labeled "unverified" — never presented as confirmed

**Patterns to avoid**
- No `any` in TypeScript — use `unknown` and narrow, or define a Zod schema
- No direct `process.env` access in application code — use a typed config module
- No raw model output rendered in the UI
- No fabricated prices to make a plan fit the budget
- No database, user accounts, maps, booking APIs, vector databases, or agent frameworks unless an approved requirement demonstrates the need

## Approved dependencies

Frontend: `react`, `react-dom`, `typescript`, `vite`, `tailwindcss`  
Validation: `zod`  
AWS: `@aws-sdk/client-bedrock-runtime`, `aws-cdk-lib`  
Testing: `vitest`, `@testing-library/react`, `@playwright/test`  
Dates: `date-fns` (not moment.js)

Add no new dependencies without a human decision.

## Forbidden dependencies

`moment.js` (use `date-fns`). `lodash` (use native JS/TS). `jquery`. Any booking, flight-pricing, or hotel-inventory API in the pilot — deferred to post-pilot. Any agent framework or vector database unless an approved requirement exists.

## Environment variables

```
AWS_REGION                  AWS region for Bedrock and other services
BEDROCK_MODEL_ID            Bedrock model identifier (confirm before use)
AMPLIFY_APP_ID              Amplify Hosting app ID (set by CI)
```

GitHub Actions uses OIDC with scoped IAM roles — no `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` in CI. Local development uses AWS SSO or named profiles.

## Issue tracking

- **JIRA board**: https://slalom-team-zhxx4q21.atlassian.net/jira/software/projects/SCRUM/boards/1
- **Ticket prefix**: `SCRUM`
- **Commit format**: `SCRUM-123: short imperative description`
- MCP config: `.claude/mcp.json` (requires `ATLASSIAN_TOKEN` env var)

## Development workflow

1. Start with `/feature-start` — reads the issue, confirms requirements against `docs/travel-ai-advisor-spec.md`
2. Code the feature
3. Run `/spec-check` — fix any doc gaps before opening PR
4. Run `/code-review` — resolve all BLOCKING findings
5. Run `/pr-ready` — confirms checklist before requesting review
6. Open PR with `/pr-ready` output pasted in description

## PR review gates (required before merge)

- [ ] `/preflight` passed
- [ ] `/code-review`: no BLOCKING findings
- [ ] `/spec-check`: no gaps
- [ ] Human reviewer approved
- [ ] CI pipeline green (type check, lint, Vitest, Playwright, build)
- [ ] AC-1–AC-11 manual checklist run for changes to AI prompts, model version, or constraint logic (see `docs/testing-guidelines.md`)

## Pods and owners

Owners not yet assigned — see open decisions in `docs/travel-ai-advisor-spec.md` §10.

| Area | Responsible role |
|------|-----------------|
| Product decisions, scope | Product owner (TBA) |
| Technical decisions, AWS stack | Technical owner (TBA) |
| QA, acceptance criteria | QA owner (TBA) |
| Delivery | Delivery owner (TBA) |
