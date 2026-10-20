import { z } from 'zod'
import type {
  TripBrief,
  Constraint,
  Preference,
  Source,
  CostLine,
  Destination,
  Activity,
  Meal,
  FreePeriod,
  BudgetEstimate,
  Day,
  Itinerary,
  ConstraintCheckResult,
  ItineraryDiff,
  ChangeSnapshot,
  CostRange,
  FlightEstimate,
  AccommodationEstimate,
  SeasonalNote,
  CatalogDestination,
} from './types.js'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Must be YYYY-MM-DD')
const isoDatetime = z.string().datetime()

// ─── Union schemas ────────────────────────────────────────────────────────────

export const BudgetCategorySchema = z.enum([
  'flights',
  'accommodation',
  'activities',
  'meals',
  'transport',
  'other',
])

export const InterestSchema = z.enum([
  'food',
  'nature',
  'culture',
  'history',
  'nightlife',
  'outdoor-adventure',
  'wellness',
  'family-friendly',
])

export const ConstraintTypeSchema = z.enum([
  'no-rental-car',
  'fixed-duration',
  'budget-ceiling',
  'no-long-flights',
  'public-transit-only',
  'accessibility',
  'other',
])

// ─── Plan state schemas ───────────────────────────────────────────────────────

export const SourceSchema = z.object({
  label: z.string().min(1),
  url: z.string().url().nullable(),
  dateChecked: isoDate,
  isStale: z.boolean(),
}) satisfies z.ZodType<Source>

export const TripBriefSchema = z.object({
  departureCity: z.string().min(1),
  startDate: isoDate.nullable(),
  endDate: isoDate.nullable(),
  durationDays: z.number().int().positive().nullable(),
  travelers: z.object({
    adults: z.number().int().min(1),
    children: z.number().int().min(0),
  }),
  budget: z.object({
    amount: z.number().positive(),
    currency: z.string().length(3),
    includes: z.array(BudgetCategorySchema),
    clarified: z.boolean(),
  }),
  interests: z.array(InterestSchema),
  pace: z.enum(['relaxed', 'moderate', 'active']),
  transportationConstraints: z.array(z.string()),
  accessibilityNeeds: z.string().nullable(),
  dietaryPreferences: z.string().nullable(),
}) satisfies z.ZodType<TripBrief>

export const ConstraintSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  type: ConstraintTypeSchema,
  source: z.enum(['user', 'derived']),
}) satisfies z.ZodType<Constraint>

export const PreferenceSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1),
  category: z.enum(['location', 'activity', 'accommodation', 'pace', 'other']),
}) satisfies z.ZodType<Preference>

export const CostLineSchema = z.object({
  category: BudgetCategorySchema,
  estimateLow: z.number().min(0),
  estimateHigh: z.number().min(0),
  currency: z.string().length(3),
  perUnit: z.enum(['total', 'per-night', 'per-person', 'per-day']),
  note: z.string().nullable(),
  source: SourceSchema,
}) satisfies z.ZodType<CostLine>

export const ActivitySchema: z.ZodType<Activity> = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string(),
  durationMinutes: z.number().int().positive(),
  estimatedCost: z.lazy(() => CostLineSchema).nullable(),
  location: z.string(),
  source: SourceSchema.nullable(),
})

export const MealSchema = z.object({
  period: z.enum(['breakfast', 'lunch', 'dinner']),
  suggestion: z.string(),
  estimatedCost: CostLineSchema.nullable(),
  alternatives: z.array(z.string()),
}) satisfies z.ZodType<Meal>

export const FreePeriodSchema = z.object({
  period: z.enum(['morning', 'afternoon', 'evening']),
  note: z.string().nullable(),
}) satisfies z.ZodType<FreePeriod>

export const BudgetEstimateSchema = z.object({
  lines: z.array(CostLineSchema),
  total: z.number().min(0),
  currency: z.string().length(3),
  ceiling: z.number().min(0),
  withinBudget: z.boolean(),
  delta: z.number(),
}) satisfies z.ZodType<BudgetEstimate>

export const DaySchema = z.object({
  dayNumber: z.number().int().min(1),
  date: isoDate.nullable(),
  label: z.string().min(1),
  activities: z.array(ActivitySchema),
  meals: z.array(MealSchema),
  freePeriods: z.array(FreePeriodSchema),
  transitNotes: z.string(),
}) satisfies z.ZodType<Day>

export const DestinationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  country: z.string().min(1),
  whyItFits: z.string(),
  tradeOffs: z.string(),
  costBreakdown: z.array(CostLineSchema),
  budgetFitsConstraint: z.boolean(),
  budgetDelta: z.number().nullable(),
  weatherNotes: z.string(),
  weatherSource: SourceSchema,
  uncertainties: z.array(z.string()),
  sources: z.array(SourceSchema),
}) satisfies z.ZodType<Destination>

export const ItinerarySchema = z.object({
  destinationId: z.string().min(1),
  days: z.array(DaySchema),
  budgetEstimate: BudgetEstimateSchema,
  transportAssumptions: z.array(z.string()),
  generatedAt: isoDatetime,
  promptVersion: z.string().min(1),
}) satisfies z.ZodType<Itinerary>

export const ConstraintCheckResultSchema = z.object({
  constraint: ConstraintSchema,
  satisfied: z.boolean(),
  note: z.string().nullable(),
}) satisfies z.ZodType<ConstraintCheckResult>

export const ItineraryDiffSchema = z.object({
  added: z.array(ActivitySchema),
  removed: z.array(ActivitySchema),
  modified: z.array(
    z.object({ before: ActivitySchema, after: ActivitySchema }),
  ),
  freePeriodChanges: z.array(
    z.object({
      day: z.number().int().min(1),
      added: z.array(FreePeriodSchema).nullable(),
      removed: z.array(FreePeriodSchema).nullable(),
    }),
  ),
}) satisfies z.ZodType<ItineraryDiff>

export const ChangeSnapshotSchema = z.object({
  timestamp: isoDatetime,
  changeRequest: z.string().min(1),
  diff: ItineraryDiffSchema,
  budgetDelta: z.number(),
  constraintRecheck: z.array(ConstraintCheckResultSchema),
}) satisfies z.ZodType<ChangeSnapshot>

// ─── Catalog schemas ──────────────────────────────────────────────────────────

export const CostRangeSchema = z.object({
  low: z.number().min(0),
  high: z.number().min(0),
  currency: z.string().length(3),
  source: SourceSchema,
}) satisfies z.ZodType<CostRange>

export const FlightEstimateSchema = z.object({
  fromCity: z.string().min(1),
  fromIata: z.string().length(3),
  roundTripRangeLow: z.number().min(0),
  roundTripRangeHigh: z.number().min(0),
  currency: z.string().length(3),
  source: SourceSchema,
  notes: z.string().nullable(),
}) satisfies z.ZodType<FlightEstimate>

export const AccommodationEstimateSchema = z.object({
  type: z.enum(['budget-hotel', 'mid-range-hotel', 'boutique-hotel', 'vacation-rental']),
  perNightRangeLow: z.number().min(0),
  perNightRangeHigh: z.number().min(0),
  currency: z.string().length(3),
  source: SourceSchema,
}) satisfies z.ZodType<AccommodationEstimate>

export const SeasonalNoteSchema = z.object({
  months: z.array(z.number().int().min(1).max(12)),
  summary: z.string().min(1),
  source: SourceSchema,
}) satisfies z.ZodType<SeasonalNote>

export const CatalogDestinationSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  region: z.string().min(1),
  country: z.string().min(1),
  tags: z.array(InterestSchema),
  goodFor: z.array(z.string()),
  notIdealFor: z.array(z.string()),
  flightFromHubs: z.array(FlightEstimateSchema),
  typicalAccommodation: z.array(AccommodationEstimateSchema),
  activityCostRange: CostRangeSchema,
  mealCostRange: CostRangeSchema,
  localTransportCostRange: CostRangeSchema,
  seasonalNotes: z.array(SeasonalNoteSchema),
  lastReviewed: isoDate,
  reviewedBy: z.string().min(1),
}) satisfies z.ZodType<CatalogDestination>
