# Architecture Specifications

## System overview

Travel AI Advisor is built on a strict three-layer separation. Each layer has one responsibility. No layer may do the work of another.

```
┌─────────────────────────────────────────────────────┐
│                  User Interface                     │
│   React + TypeScript + Vite · Tailwind CSS          │
│   Trip Brief · Destination Cards · Itinerary        │
└──────────────────────┬──────────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────────┐
│               Application Logic                     │
│   Node.js + TypeScript · AWS Lambda + API Gateway   │
│   Constraint validation · Budget totals             │
│   Change diffing · Zod schema validation            │
└────────────┬──────────────────────────┬─────────────┘
             │                          │
┌────────────▼────────────┐  ┌──────────▼──────────────┐
│      AI Runtime         │  │   Travel Data Layer     │
│  Amazon Bedrock         │  │   Versioned JSON catalog │
│  (AWS SDK for JS)       │  │   with source URLs and  │
│  Interpret intent       │  │   checked dates         │
│  Propose options        │  │   (pilot: curated;      │
│  Explain trade-offs     │  │   post-pilot: live API) │
└─────────────────────────┘  └─────────────────────────┘
```

---

## Technology stack

| Area | Technology | Notes |
|------|-----------|-------|
| Web interface | React + TypeScript + Vite | Three interactive views; no SSR required for pilot |
| Styling | Tailwind CSS | Consistent, responsive layouts |
| Backend | Node.js (AWS-supported LTS) + TypeScript | Shared language with frontend; handles data and AI calls |
| AI runtime | Amazon Bedrock (AWS SDK for JavaScript) | Evaluate available model against acceptance scenarios before choosing; confirm region, access, latency, and cost |
| Input/output validation | Zod | Explicit schemas for briefs, destination cards, and itineraries; rejects invalid model output |
| Travel catalog | Versioned JSON files | Source URLs, checked dates, cost basis, and uncertainty fields; no database required for pilot |
| Infrastructure | AWS CDK (TypeScript) | Repeatable configuration in source control |
| Hosting | AWS Amplify Hosting | Managed React hosting with HTTPS and GitHub integration |
| API | AWS Lambda + Amazon API Gateway | Managed execution without servers; confirm model-response latency fits configured request limits |
| Monitoring | Amazon CloudWatch | Operational errors and usage; do not log complete conversations or optional sensitive trip details by default |
| Cost visibility | AWS Budgets | Owner-approved alerts; alerts alone do not cap spend — add request, concurrency, and AI-usage limits before exposing the pilot |
| CI/CD | GitHub Actions | Type checks, linting, unit/component tests, production build, and end-to-end acceptance scenarios |

> **Bedrock note**: Bedrock is the proposed AI runtime for the travel product. Its use requires owner approval and review of organizational AI and data rules. Do not send private project records or credentials to a model.

---

## Layer responsibilities

### UI layer (React + TypeScript + Vite)

- Renders the three views: Trip Brief, Destination Comparison, Itinerary Workspace
- Makes plan state inspectable and editable directly — users never dig through conversation history to find their current budget or itinerary
- Exposes source labels, freshness dates, and estimate warnings on every fact
- Calls the API Gateway; never calls Bedrock directly
- Validates user input with Zod before sending to the API
- Shows an explicit error and preserves the previous valid plan if the API returns an invalid result

### Application logic layer (Node.js + TypeScript on Lambda)

- Classifies user inputs as hard constraints vs. preferences
- Validates that a proposed plan satisfies all hard constraints before presenting it — using deterministic application code, not model-generated arithmetic
- Calculates and totals budget figures; the AI model does not perform arithmetic
- Validates all model output with Zod schemas before returning it to the UI
- Diffs the itinerary before and after a refinement to produce change summaries
- Enforces the budget honesty rule: blocks any plan that silently adjusts prices to fit constraints
- Routes plan generation requests to Bedrock with a well-formed prompt
- Routes fact lookups to the travel data layer (JSON catalog)

### AI runtime layer (Amazon Bedrock)

- Interprets natural-language trip preferences
- Proposes destination options with rationale and trade-off explanations
- Generates day-by-day itinerary structure
- Responds to refinement requests in natural language
- **Does not** supply prices, opening hours, availability, or other travel facts — those come from the JSON catalog
- **Does not** perform arithmetic — totals are calculated by the application layer

### Travel data layer (versioned JSON catalog)

- Supplies traceable facts: destination descriptions, typical price ranges, transit options, seasonal notes
- Each fact is stored with its source URL and the date it was verified
- Files are versioned in source control; changes go through pull request review
- Pilot phase: a static, human-curated catalog of a small number of destinations
- Post-pilot: optional integration with one live travel data API

---

## Data flow

### 1. Trip brief → destination proposals

```
User fills Trip Brief (React form, Zod-validated)
        │
        ▼
Lambda: classify constraints vs. preferences
        │
        ▼
Lambda: query JSON catalog for candidate destinations
        │
        ▼
Lambda: send [constraints + preferences + catalog subset] to Bedrock
        │
        ▼
Bedrock returns ranked proposals with rationale and trade-offs
        │
        ▼
Lambda: validate response with Zod schema
Lambda: validate each proposal against hard constraints
Lambda: calculate budget totals from catalog figures
        │
        ▼
UI renders up to 3 destination cards
```

### 2. Destination selection → itinerary

```
User selects destination
        │
        ▼
Lambda: fetch destination facts from JSON catalog
        │
        ▼
Lambda: send [destination facts + constraints + preferences] to Bedrock
        │
        ▼
Bedrock returns itinerary structure (days, activities, meals, transport)
        │
        ▼
Lambda: validate structure with Zod schema
Lambda: calculate budget totals from catalog price ranges
Lambda: validate full plan against all hard constraints
        │
        ▼
UI renders Itinerary Workspace
```

### 3. Refinement request

```
User requests change ("make day 2 less busy")
        │
        ▼
Lambda: send [current itinerary snapshot + change request + constraints] to Bedrock
        │
        ▼
Bedrock returns revised itinerary
        │
        ▼
Lambda: validate structure with Zod schema
Lambda: diff old vs. new itinerary
Lambda: recalculate budget totals
Lambda: recheck entire revised plan against all hard constraints
Lambda: identify any conflicts or new uncertainties
        │
        ▼
UI shows change summary + updated Itinerary Workspace
If Zod validation fails or a constraint is violated → return error, preserve previous plan
```

---

## Infrastructure and deployment

- All AWS resources are defined in CDK (TypeScript); no undocumented manual changes
- GitHub Actions deploys on merge to main after all checks pass; deployment is separately authorized
- GitHub Actions uses OIDC with narrowly scoped IAM roles — no long-lived AWS access keys
- IAM trust is restricted to the approved repository and branch or environment
- The main branch is protected: human review and passing checks required before merge

---

## Data and privacy

- Collect only information needed for planning: departure city, dates, traveler count, budget, interests, pace, transport preferences
- Passport details and payment information are not collected or stored
- Travel dates and optional accessibility/dietary preferences are treated as potentially sensitive
- Data retention, sharing, and deletion rules require product owner agreement before implementation
- CloudWatch logs must not include complete conversations or optional sensitive trip details by default

---

## Pilot constraints and deferred decisions

| Decision | Pilot | Post-pilot option |
|----------|-------|-------------------|
| Travel data | Static JSON catalog (5–10 destinations) | Live flight/hotel API |
| Pricing | Manually researched ranges with dates | Real-time quotes |
| Map view | Not included | Mapbox / Google Maps |
| User accounts / saved plans | Not included — requires owner approval and defined access/deletion rules | Amazon Cognito + DynamoDB |
| Database | Not included | Amazon DynamoDB if saved plans are approved |
| Languages | English only | i18n |

Do not add a database, user accounts, maps, booking APIs, a vector database, or an agent framework unless an approved requirement demonstrates the need.
