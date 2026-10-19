# Data Model

## Overview

The data model has two concerns:
1. **Plan state** — the in-memory object the application builds and passes between layers
2. **Curated catalog** — the persistent travel data that supplies facts to the AI model

---

## Plan state

### `TripBrief`

The user's inputs. Collected in View 1 (Trip Brief).

```typescript
interface TripBrief {
  departureCity: string
  startDate: string | null       // ISO 8601 date, null if using durationDays
  endDate: string | null         // ISO 8601 date, null if using durationDays
  durationDays: number | null    // null if using startDate/endDate
  travelers: {
    adults: number
    children: number
  }
  budget: {
    amount: number
    currency: string             // ISO 4217 (e.g. "USD")
    includes: BudgetCategory[]   // what the budget covers
    clarified: boolean           // true once the user has confirmed inclusions
  }
  interests: Interest[]
  pace: "relaxed" | "moderate" | "active"
  transportationConstraints: string[]
  accessibilityNeeds: string | null
  dietaryPreferences: string | null
}

type BudgetCategory = "flights" | "accommodation" | "activities" | "meals" | "transport" | "other"
type Interest = "food" | "nature" | "culture" | "history" | "nightlife" | "outdoor-adventure" | "wellness" | "family-friendly"
```

---

### `Constraint` and `Preference`

Produced by the constraint classification step.

```typescript
interface Constraint {
  id: string
  text: string                   // original user text
  type: ConstraintType
  source: "user" | "derived"
}

type ConstraintType =
  | "no-rental-car"
  | "fixed-duration"
  | "budget-ceiling"
  | "no-long-flights"            // e.g. no flights over 4 hours
  | "public-transit-only"
  | "accessibility"
  | "other"

interface Preference {
  id: string
  text: string
  category: "location" | "activity" | "accommodation" | "pace" | "other"
}
```

---

### `Destination`

A proposed destination option. Up to three per plan.

```typescript
interface Destination {
  id: string
  name: string
  region: string
  country: string
  whyItFits: string              // AI-generated, 2–3 sentences
  tradeOffs: string              // AI-generated
  costBreakdown: CostLine[]
  budgetFitsConstraint: boolean  // calculated by app layer
  budgetDelta: number | null     // positive = over budget, negative = under
  weatherNotes: string
  weatherSource: Source
  uncertainties: string[]
  sources: Source[]
}
```

---

### `CostLine`

One line in a cost breakdown. All monetary figures come from the data layer, not the AI model.

```typescript
interface CostLine {
  category: BudgetCategory
  estimateLow: number
  estimateHigh: number
  currency: string
  perUnit: "total" | "per-night" | "per-person" | "per-day"
  note: string | null
  source: Source
}
```

---

### `Source`

Provenance for any fact.

```typescript
interface Source {
  label: string                  // human-readable name (e.g. "Google Flights")
  url: string | null
  dateChecked: string            // ISO 8601 date
  isStale: boolean               // true if dateChecked is > 90 days ago
}
```

---

### `Itinerary`

The day-by-day plan.

```typescript
interface Itinerary {
  destinationId: string
  days: Day[]
  budgetEstimate: BudgetEstimate
  transportAssumptions: string[]
  generatedAt: string            // ISO 8601 datetime
  promptVersion: string          // e.g. "itinerary-v1"
}

interface Day {
  dayNumber: number              // 1-indexed
  date: string | null            // ISO 8601 date, null if no fixed dates
  label: string                  // e.g. "Day 1 — Arrival & Old Town"
  activities: Activity[]
  meals: Meal[]
  freePeriods: FreePeriod[]
  transitNotes: string
}

interface Activity {
  id: string
  name: string
  description: string
  durationMinutes: number
  estimatedCost: CostLine | null  // null for free activities
  location: string
  source: Source | null
}

interface Meal {
  period: "breakfast" | "lunch" | "dinner"
  suggestion: string
  estimatedCost: CostLine | null
  alternatives: string[]
}

interface FreePeriod {
  period: "morning" | "afternoon" | "evening"
  note: string | null
}

interface BudgetEstimate {
  lines: CostLine[]
  total: number
  currency: string
  ceiling: number                // from TripBrief.budget.amount
  withinBudget: boolean
  delta: number                  // total - ceiling (negative = under budget)
}
```

---

### `ChangeSnapshot`

Produced after every refinement.

```typescript
interface ChangeSnapshot {
  timestamp: string
  changeRequest: string          // verbatim user text
  diff: ItineraryDiff
  budgetDelta: number            // positive = cost increased
  constraintRecheck: ConstraintCheckResult[]
}

interface ItineraryDiff {
  added: Activity[]
  removed: Activity[]
  modified: { before: Activity; after: Activity }[]
  freePeriodChanges: { day: number; added: FreePeriod[] | null; removed: FreePeriod[] | null }[]
}

interface ConstraintCheckResult {
  constraint: Constraint
  satisfied: boolean
  note: string | null
}
```

---

## Curated catalog (data layer)

The pilot uses a static catalog stored as JSON. Each entry is a destination with planning data and full source provenance.

### Catalog entry schema

```typescript
interface CatalogDestination {
  id: string
  name: string
  region: string
  country: string
  tags: Interest[]
  goodFor: string[]              // e.g. ["walkable", "no-car-needed", "family-friendly"]
  notIdealFor: string[]          // e.g. ["budget travelers", "beach seekers"]

  flightFromHubs: FlightEstimate[]
  typicalAccommodation: AccommodationEstimate[]
  activityCostRange: CostRange   // daily, per person
  mealCostRange: CostRange       // daily, per person
  localTransportCostRange: CostRange  // daily

  seasonalNotes: SeasonalNote[]
  lastReviewed: string           // ISO 8601 date
  reviewedBy: string             // name or initials of curator
}

interface FlightEstimate {
  fromCity: string
  fromIata: string
  roundTripRangeLow: number
  roundTripRangeHigh: number
  currency: string
  source: Source
  notes: string | null           // e.g. "Budget carriers available"
}

interface AccommodationEstimate {
  type: "budget-hotel" | "mid-range-hotel" | "boutique-hotel" | "vacation-rental"
  perNightRangeLow: number
  perNightRangeHigh: number
  currency: string
  source: Source
}

interface CostRange {
  low: number
  high: number
  currency: string
  source: Source
}

interface SeasonalNote {
  months: number[]               // 1–12
  summary: string
  source: Source
}
```

### Catalog maintenance rules

- Each entry must have a `lastReviewed` date
- Entries not reviewed within 90 days are flagged as stale in the UI
- A curator (a human, not the AI model) reviews and updates each entry
- Price ranges are verified against at least one bookable source; the source URL is recorded
- The AI model never writes to the catalog
