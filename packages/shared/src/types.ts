// Plan-state and catalog types — see docs/data-model.md for full spec

export type BudgetCategory =
  | 'flights'
  | 'accommodation'
  | 'activities'
  | 'meals'
  | 'transport'
  | 'other'

export type Interest =
  | 'food'
  | 'nature'
  | 'culture'
  | 'history'
  | 'nightlife'
  | 'outdoor-adventure'
  | 'wellness'
  | 'family-friendly'

export type ConstraintType =
  | 'no-rental-car'
  | 'fixed-duration'
  | 'budget-ceiling'
  | 'no-long-flights'
  | 'public-transit-only'
  | 'accessibility'
  | 'other'

// ─── Plan state ───────────────────────────────────────────────────────────────

export interface TripBrief {
  departureCity: string
  startDate: string | null
  endDate: string | null
  durationDays: number | null
  travelers: {
    adults: number
    children: number
  }
  budget: {
    amount: number
    currency: string
    includes: BudgetCategory[]
    clarified: boolean
  }
  interests: Interest[]
  pace: 'relaxed' | 'moderate' | 'active'
  transportationConstraints: string[]
  accessibilityNeeds: string | null
  dietaryPreferences: string | null
}

export interface Constraint {
  id: string
  text: string
  type: ConstraintType
  source: 'user' | 'derived'
}

export interface Preference {
  id: string
  text: string
  category: 'location' | 'activity' | 'accommodation' | 'pace' | 'other'
}

export interface Source {
  label: string
  url: string | null
  dateChecked: string
  isStale: boolean
}

export interface CostLine {
  category: BudgetCategory
  estimateLow: number
  estimateHigh: number
  currency: string
  perUnit: 'total' | 'per-night' | 'per-person' | 'per-day'
  note: string | null
  source: Source
}

export interface Destination {
  id: string
  name: string
  region: string
  country: string
  whyItFits: string
  tradeOffs: string
  costBreakdown: CostLine[]
  budgetFitsConstraint: boolean
  budgetDelta: number | null
  weatherNotes: string
  weatherSource: Source
  uncertainties: string[]
  sources: Source[]
}

export interface Activity {
  id: string
  name: string
  description: string
  durationMinutes: number
  estimatedCost: CostLine | null
  location: string
  source: Source | null
}

export interface Meal {
  period: 'breakfast' | 'lunch' | 'dinner'
  suggestion: string
  estimatedCost: CostLine | null
  alternatives: string[]
}

export interface FreePeriod {
  period: 'morning' | 'afternoon' | 'evening'
  note: string | null
}

export interface BudgetEstimate {
  lines: CostLine[]
  total: number
  currency: string
  ceiling: number
  withinBudget: boolean
  delta: number
}

export interface Day {
  dayNumber: number
  date: string | null
  label: string
  activities: Activity[]
  meals: Meal[]
  freePeriods: FreePeriod[]
  transitNotes: string
}

export interface Itinerary {
  destinationId: string
  days: Day[]
  budgetEstimate: BudgetEstimate
  transportAssumptions: string[]
  generatedAt: string
  promptVersion: string
}

export interface ConstraintCheckResult {
  constraint: Constraint
  satisfied: boolean
  note: string | null
}

export interface ItineraryDiff {
  added: Activity[]
  removed: Activity[]
  modified: { before: Activity; after: Activity }[]
  freePeriodChanges: {
    day: number
    added: FreePeriod[] | null
    removed: FreePeriod[] | null
  }[]
}

export interface ChangeSnapshot {
  timestamp: string
  changeRequest: string
  diff: ItineraryDiff
  budgetDelta: number
  constraintRecheck: ConstraintCheckResult[]
}

// ─── Catalog types ────────────────────────────────────────────────────────────

export interface CostRange {
  low: number
  high: number
  currency: string
  source: Source
}

export interface FlightEstimate {
  fromCity: string
  fromIata: string
  roundTripRangeLow: number
  roundTripRangeHigh: number
  currency: string
  source: Source
  notes: string | null
}

export interface AccommodationEstimate {
  type: 'budget-hotel' | 'mid-range-hotel' | 'boutique-hotel' | 'vacation-rental'
  perNightRangeLow: number
  perNightRangeHigh: number
  currency: string
  source: Source
}

export interface SeasonalNote {
  months: number[]
  summary: string
  source: Source
}

export interface CatalogDestination {
  id: string
  name: string
  region: string
  country: string
  tags: Interest[]
  goodFor: string[]
  notIdealFor: string[]
  flightFromHubs: FlightEstimate[]
  typicalAccommodation: AccommodationEstimate[]
  activityCostRange: CostRange
  mealCostRange: CostRange
  localTransportCostRange: CostRange
  seasonalNotes: SeasonalNote[]
  lastReviewed: string
  reviewedBy: string
}
