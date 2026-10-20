import { useState } from 'react'
import type { BudgetCategory, Constraint, Interest, Preference, TripBrief } from '@trip-advisor/shared'
import { TripBriefSchema } from '@trip-advisor/shared'
import { classifyTripBrief } from '../lib/classifier.js'
import ConstraintChip from './ConstraintChip.js'
import PreferenceChip from './PreferenceChip.js'

// ─── Constants ────────────────────────────────────────────────────────────────

const INTEREST_OPTIONS: { value: Interest; label: string }[] = [
  { value: 'food', label: 'Food' },
  { value: 'nature', label: 'Nature' },
  { value: 'culture', label: 'Culture' },
  { value: 'history', label: 'History' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'outdoor-adventure', label: 'Outdoor Adventure' },
  { value: 'wellness', label: 'Wellness' },
  { value: 'family-friendly', label: 'Family-Friendly' },
]

const BUDGET_INCLUDE_OPTIONS: { value: BudgetCategory; label: string }[] = [
  { value: 'flights', label: 'Flights' },
  { value: 'accommodation', label: 'Accommodation' },
  { value: 'activities', label: 'Activities' },
  { value: 'meals', label: 'Meals' },
  { value: 'transport', label: 'Local transport' },
]

const TRANSPORT_OPTIONS = ['No rental car', 'Public transit only', 'No long flights']

// ─── Types ────────────────────────────────────────────────────────────────────

type FlightsClarification = 'yes' | 'no' | 'unsure' | null

interface FormValues {
  departureCity: string
  startDate: string
  endDate: string
  durationDays: string
  adults: number
  children: number
  budgetAmount: string
  budgetCurrency: string
  budgetIncludes: BudgetCategory[]
  flightsClarification: FlightsClarification
  interests: Interest[]
  pace: 'relaxed' | 'moderate' | 'active' | ''
  transportationConstraints: string[]
  accessibilityNeeds: string
  dietaryPreferences: string
}

interface SubmitResult {
  brief: TripBrief
  constraints: Constraint[]
  preferences: Preference[]
}

export interface TripBriefFormProps {
  onSubmit?: (result: SubmitResult) => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const INITIAL: FormValues = {
  departureCity: '',
  startDate: '',
  endDate: '',
  durationDays: '',
  adults: 1,
  children: 0,
  budgetAmount: '',
  budgetCurrency: 'USD',
  budgetIncludes: [],
  flightsClarification: null,
  interests: [],
  pace: '',
  transportationConstraints: [],
  accessibilityNeeds: '',
  dietaryPreferences: '',
}

function toggleItem<T>(arr: T[], item: T): T[] {
  return arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item]
}

function buildTripBrief(v: FormValues): TripBrief {
  const includes: BudgetCategory[] = v.flightsClarification === 'yes'
    ? [...new Set([...v.budgetIncludes, 'flights' as BudgetCategory])]
    : v.flightsClarification === 'no'
    ? v.budgetIncludes.filter((c) => c !== 'flights')
    : v.budgetIncludes

  return {
    departureCity: v.departureCity.trim(),
    startDate: v.startDate || null,
    endDate: v.endDate || null,
    durationDays: v.durationDays ? parseInt(v.durationDays, 10) : null,
    travelers: { adults: v.adults, children: v.children },
    budget: {
      amount: parseFloat(v.budgetAmount) || 0,
      currency: v.budgetCurrency,
      includes,
      clarified: v.flightsClarification === 'yes' || v.flightsClarification === 'no',
    },
    interests: v.interests,
    pace: v.pace as TripBrief['pace'],
    transportationConstraints: v.transportationConstraints,
    accessibilityNeeds: v.accessibilityNeeds.trim() || null,
    dietaryPreferences: v.dietaryPreferences.trim() || null,
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function TripBriefForm({ onSubmit }: TripBriefFormProps) {
  const [values, setValues] = useState<FormValues>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [result, setResult] = useState<SubmitResult | null>(null)
  const [editedAfterSubmit, setEditedAfterSubmit] = useState(false)

  const showClarification = values.budgetAmount !== ''
  const clarificationBlocking =
    showClarification && (values.flightsClarification === null || values.flightsClarification === 'unsure')

  function update(patch: Partial<FormValues>) {
    setValues((v) => ({ ...v, ...patch }))
    if (result) setEditedAfterSubmit(true)
    // Clear related errors on change
    if (patch.departureCity !== undefined) clearError('departureCity')
    if (patch.interests !== undefined) clearError('interests')
    if (patch.pace !== undefined) clearError('pace')
    if (patch.budgetAmount !== undefined || patch.budgetIncludes !== undefined) clearError('budget')
    if (patch.flightsClarification !== undefined) clearError('flightsClarification')
  }

  function clearError(key: string) {
    setErrors((e) => { const next = { ...e }; delete next[key]; return next })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const newErrors: Record<string, string> = {}

    if (!values.departureCity.trim()) newErrors.departureCity = 'Departure city is required.'
    if (!values.startDate && !values.endDate && !values.durationDays)
      newErrors.dates = 'Enter travel dates or a duration.'
    if (!values.budgetAmount || parseFloat(values.budgetAmount) <= 0)
      newErrors.budget = 'Enter a budget amount.'
    if (clarificationBlocking)
      newErrors.flightsClarification = 'Please clarify whether your budget includes flights before continuing.'
    if (values.interests.length === 0) newErrors.interests = 'Select at least one interest.'
    if (!values.pace) newErrors.pace = 'Select a preferred pace.'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    const brief = buildTripBrief(values)
    const parsed = TripBriefSchema.safeParse(brief)
    if (!parsed.success) {
      setErrors({ _form: 'Some fields are invalid. Please check your inputs.' })
      return
    }

    const { constraints, preferences } = classifyTripBrief(parsed.data)
    const submitResult = { brief: parsed.data, constraints, preferences }
    setResult(submitResult)
    setEditedAfterSubmit(false)
    setErrors({})
    onSubmit?.(submitResult)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900">Plan your trip</h1>
      <p className="mt-1 text-sm text-gray-500">
        An estimate is not a quote. A recommendation is not confirmed availability.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-6">

        {/* Departure city */}
        <div>
          <label htmlFor="departureCity" className="block text-sm font-medium text-gray-700">
            Departure city <span aria-hidden="true" className="text-red-500">*</span>
          </label>
          <input
            id="departureCity"
            type="text"
            value={values.departureCity}
            onChange={(e) => update({ departureCity: e.target.value })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-describedby={errors.departureCity ? 'departureCity-error' : undefined}
            aria-invalid={!!errors.departureCity}
          />
          {errors.departureCity && (
            <p id="departureCity-error" role="alert" className="mt-1 text-xs text-red-600">
              {errors.departureCity}
            </p>
          )}
        </div>

        {/* Travel dates / duration */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            Travel dates or duration <span aria-hidden="true" className="text-red-500">*</span>
          </legend>
          <div className="mt-1 grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="startDate" className="block text-xs text-gray-500">Start date</label>
              <input
                id="startDate"
                type="date"
                value={values.startDate}
                onChange={(e) => update({ startDate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs text-gray-500">End date</label>
              <input
                id="endDate"
                type="date"
                value={values.endDate}
                onChange={(e) => update({ endDate: e.target.value })}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-xs text-gray-400">or</span>
            <div className="flex items-center gap-2">
              <label htmlFor="durationDays" className="text-xs text-gray-500">Number of days</label>
              <input
                id="durationDays"
                type="number"
                min={1}
                value={values.durationDays}
                onChange={(e) => update({ durationDays: e.target.value })}
                className="w-20 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>
          {errors.dates && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.dates}</p>
          )}
        </fieldset>

        {/* Travelers */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            Travelers <span aria-hidden="true" className="text-red-500">*</span>
          </legend>
          <div className="mt-1 flex gap-6">
            {([['adults', 'Adults', 1] as const, ['children', 'Children', 0] as const]).map(
              ([field, label, min]) => (
                <div key={field} className="flex items-center gap-2">
                  <label htmlFor={field} className="text-sm text-gray-600">{label}</label>
                  <button
                    type="button"
                    aria-label={`Decrease ${label}`}
                    onClick={() => update({ [field]: Math.max(min, values[field] - 1) } as Partial<FormValues>)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >−</button>
                  <span id={field} aria-live="polite" className="w-6 text-center text-sm font-medium">
                    {values[field]}
                  </span>
                  <button
                    type="button"
                    aria-label={`Increase ${label}`}
                    onClick={() => update({ [field]: values[field] + 1 } as Partial<FormValues>)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >+</button>
                </div>
              ),
            )}
          </div>
        </fieldset>

        {/* Budget */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            Budget <span aria-hidden="true" className="text-red-500">*</span>
          </legend>
          <div className="mt-1 flex gap-2">
            <select
              aria-label="Currency"
              value={values.budgetCurrency}
              onChange={(e) => update({ budgetCurrency: e.target.value })}
              className="rounded-md border border-gray-300 px-2 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            >
              {['USD', 'EUR', 'GBP', 'CAD', 'AUD'].map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input
              id="budgetAmount"
              type="number"
              min={1}
              placeholder="Total amount"
              value={values.budgetAmount}
              onChange={(e) => update({ budgetAmount: e.target.value, flightsClarification: null })}
              className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
              aria-describedby={errors.budget ? 'budget-error' : undefined}
              aria-invalid={!!errors.budget}
            />
          </div>

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            <span className="text-xs text-gray-500">What does this cover?</span>
            {BUDGET_INCLUDE_OPTIONS.map(({ value, label }) => (
              <label key={value} className="flex items-center gap-1 text-xs text-gray-600">
                <input
                  type="checkbox"
                  checked={values.budgetIncludes.includes(value)}
                  onChange={() => update({ budgetIncludes: toggleItem(values.budgetIncludes, value) })}
                  className="rounded border-gray-300"
                />
                {label}
              </label>
            ))}
          </div>

          {/* Budget clarification prompt — AC-1 */}
          {showClarification && (
            <div
              role="group"
              aria-labelledby="flights-clarification-label"
              className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3"
            >
              <p id="flights-clarification-label" className="text-sm font-medium text-amber-800">
                Does this budget include flights?
              </p>
              <div className="mt-2 flex gap-3">
                {(['yes', 'no', 'unsure'] as const).map((opt) => (
                  <label key={opt} className="flex items-center gap-1 text-sm text-amber-900 capitalize">
                    <input
                      type="radio"
                      name="flightsClarification"
                      value={opt}
                      checked={values.flightsClarification === opt}
                      onChange={() => update({ flightsClarification: opt })}
                    />
                    {opt === 'yes' ? 'Yes' : opt === 'no' ? 'No' : 'Not sure'}
                  </label>
                ))}
              </div>
              {values.flightsClarification === 'unsure' && (
                <p role="alert" className="mt-2 text-xs text-amber-700">
                  Please clarify whether flights are included before continuing.
                </p>
              )}
            </div>
          )}

          {errors.budget && (
            <p id="budget-error" role="alert" className="mt-1 text-xs text-red-600">{errors.budget}</p>
          )}
          {errors.flightsClarification && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.flightsClarification}</p>
          )}
        </fieldset>

        {/* Interests */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            Interests <span aria-hidden="true" className="text-red-500">*</span>
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {INTEREST_OPTIONS.map(({ value, label }) => {
              const selected = values.interests.includes(value)
              return (
                <button
                  key={value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => update({ interests: toggleItem(values.interests, value) })}
                  className={`rounded-full border px-3 py-1 text-sm transition-colors ${
                    selected
                      ? 'border-blue-500 bg-blue-100 text-blue-800'
                      : 'border-gray-300 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
          {errors.interests && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.interests}</p>
          )}
        </fieldset>

        {/* Pace */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">
            Preferred pace <span aria-hidden="true" className="text-red-500">*</span>
          </legend>
          <div role="group" className="mt-1 flex rounded-md border border-gray-300 overflow-hidden w-fit">
            {(['relaxed', 'moderate', 'active'] as const).map((p) => (
              <button
                key={p}
                type="button"
                aria-pressed={values.pace === p}
                onClick={() => update({ pace: p })}
                className={`px-4 py-2 text-sm capitalize transition-colors first:border-l-0 border-l border-gray-300 ${
                  values.pace === p
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          {errors.pace && (
            <p role="alert" className="mt-1 text-xs text-red-600">{errors.pace}</p>
          )}
        </fieldset>

        {/* Transportation */}
        <fieldset>
          <legend className="block text-sm font-medium text-gray-700">Transportation restrictions</legend>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {TRANSPORT_OPTIONS.map((opt) => (
              <label key={opt} className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={values.transportationConstraints.includes(opt)}
                  onChange={() =>
                    update({ transportationConstraints: toggleItem(values.transportationConstraints, opt) })
                  }
                  className="rounded border-gray-300"
                />
                {opt}
              </label>
            ))}
          </div>
        </fieldset>

        {/* Optional fields */}
        <div className="space-y-4 border-t border-gray-100 pt-4">
          <p className="text-xs text-gray-400">Optional</p>
          <div>
            <label htmlFor="accessibilityNeeds" className="block text-sm font-medium text-gray-700">
              Accessibility needs
            </label>
            <input
              id="accessibilityNeeds"
              type="text"
              value={values.accessibilityNeeds}
              onChange={(e) => update({ accessibilityNeeds: e.target.value })}
              placeholder="e.g. wheelchair accessible, step-free"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label htmlFor="dietaryPreferences" className="block text-sm font-medium text-gray-700">
              Dietary preferences
            </label>
            <input
              id="dietaryPreferences"
              type="text"
              value={values.dietaryPreferences}
              onChange={(e) => update({ dietaryPreferences: e.target.value })}
              placeholder="e.g. vegetarian, nut allergy"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {errors._form && (
          <p role="alert" className="text-sm text-red-600">{errors._form}</p>
        )}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Find destinations
        </button>
      </form>

      {/* Recalculation warning */}
      {editedAfterSubmit && (
        <div role="status" className="mt-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Changing this will update your destination options. Re-submit the form to apply.
        </div>
      )}

      {/* Classification result — constraints and preferences */}
      {result && !editedAfterSubmit && (
        <section aria-label="Trip summary" className="mt-6 space-y-4">
          {result.constraints.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Hard constraints
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.constraints.map((c) => (
                  <ConstraintChip key={c.id} constraint={c} />
                ))}
              </div>
            </div>
          )}
          {result.preferences.length > 0 && (
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Preferences
              </h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {result.preferences.map((p) => (
                  <PreferenceChip key={p.id} preference={p} />
                ))}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  )
}
