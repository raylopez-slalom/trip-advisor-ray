import { describe, expect, it } from 'vitest'
import type { TripBrief } from '@trip-advisor/shared'
import { classifyTripBrief } from './classifier.js'

const BASE_BRIEF: TripBrief = {
  departureCity: 'Chicago',
  startDate: '2025-06-01',
  endDate: '2025-06-06',
  durationDays: 5,
  travelers: { adults: 2, children: 0 },
  budget: { amount: 2500, currency: 'USD', includes: ['flights', 'accommodation'], clarified: true },
  interests: ['food', 'culture'],
  pace: 'moderate',
  transportationConstraints: [],
  accessibilityNeeds: null,
  dietaryPreferences: null,
}

// ─── Constraint classification ────────────────────────────────────────────────

describe('fixed-duration constraint', () => {
  it('emits a fixed-duration constraint when durationDays is set', () => {
    const { constraints } = classifyTripBrief(BASE_BRIEF)
    const c = constraints.find((x) => x.type === 'fixed-duration')
    expect(c).toBeDefined()
    expect(c?.text).toBe('5 days')
    expect(c?.source).toBe('user')
  })

  it('uses singular "day" when durationDays is 1', () => {
    const { constraints } = classifyTripBrief({ ...BASE_BRIEF, durationDays: 1 })
    expect(constraints.find((x) => x.type === 'fixed-duration')?.text).toBe('1 day')
  })

  it('does not emit a fixed-duration constraint when durationDays is null', () => {
    const { constraints } = classifyTripBrief({ ...BASE_BRIEF, durationDays: null })
    expect(constraints.find((x) => x.type === 'fixed-duration')).toBeUndefined()
  })
})

describe('budget-ceiling constraint', () => {
  it('emits a budget-ceiling constraint when clarified is true', () => {
    const { constraints } = classifyTripBrief(BASE_BRIEF)
    const c = constraints.find((x) => x.type === 'budget-ceiling')
    expect(c).toBeDefined()
    expect(c?.source).toBe('user')
    expect(c?.text).toContain('2,500')
    expect(c?.text).toContain('USD')
  })

  it('does NOT emit a budget-ceiling constraint when clarified is false', () => {
    const brief = { ...BASE_BRIEF, budget: { ...BASE_BRIEF.budget, clarified: false } }
    const { constraints } = classifyTripBrief(brief)
    expect(constraints.find((x) => x.type === 'budget-ceiling')).toBeUndefined()
  })
})

describe('transportation constraints', () => {
  it('"no rental car" → no-rental-car', () => {
    const brief = { ...BASE_BRIEF, transportationConstraints: ['no rental car'] }
    const { constraints } = classifyTripBrief(brief)
    expect(constraints.find((x) => x.type === 'no-rental-car')).toBeDefined()
  })

  it('"public transit only" → public-transit-only', () => {
    const brief = { ...BASE_BRIEF, transportationConstraints: ['public transit only'] }
    const { constraints } = classifyTripBrief(brief)
    expect(constraints.find((x) => x.type === 'public-transit-only')).toBeDefined()
  })

  it('"no long flights" → no-long-flights', () => {
    const brief = { ...BASE_BRIEF, transportationConstraints: ['no long flights'] }
    const { constraints } = classifyTripBrief(brief)
    expect(constraints.find((x) => x.type === 'no-long-flights')).toBeDefined()
  })

  it('unrecognized transport text → other', () => {
    const brief = { ...BASE_BRIEF, transportationConstraints: ['prefer window seats'] }
    const { constraints } = classifyTripBrief(brief)
    expect(constraints.find((x) => x.type === 'other')).toBeDefined()
  })

  it('multiple transport constraints produce one entry each', () => {
    const brief = { ...BASE_BRIEF, transportationConstraints: ['no rental car', 'public transit only'] }
    const { constraints } = classifyTripBrief(brief)
    expect(constraints.filter((x) => x.type === 'no-rental-car')).toHaveLength(1)
    expect(constraints.filter((x) => x.type === 'public-transit-only')).toHaveLength(1)
  })
})

describe('accessibility constraint', () => {
  it('emits an accessibility constraint when accessibilityNeeds is set', () => {
    const brief = { ...BASE_BRIEF, accessibilityNeeds: 'wheelchair accessible' }
    const { constraints } = classifyTripBrief(brief)
    const c = constraints.find((x) => x.type === 'accessibility')
    expect(c).toBeDefined()
    expect(c?.text).toBe('wheelchair accessible')
  })

  it('does not emit an accessibility constraint when accessibilityNeeds is null', () => {
    const { constraints } = classifyTripBrief(BASE_BRIEF)
    expect(constraints.find((x) => x.type === 'accessibility')).toBeUndefined()
  })
})

// ─── Preference classification ────────────────────────────────────────────────

describe('interest preferences', () => {
  it('each interest becomes an activity preference', () => {
    const { preferences } = classifyTripBrief(BASE_BRIEF)
    const activities = preferences.filter((p) => p.category === 'activity')
    expect(activities).toHaveLength(2)
    expect(activities.map((p) => p.id)).toContain('interest-food')
    expect(activities.map((p) => p.id)).toContain('interest-culture')
  })

  it('hyphenated interests are displayed with spaces', () => {
    const brief = { ...BASE_BRIEF, interests: ['outdoor-adventure' as const] }
    const { preferences } = classifyTripBrief(brief)
    expect(preferences.find((p) => p.id === 'interest-outdoor-adventure')?.text).toBe('outdoor adventure')
  })

  it('produces no interest preferences when interests is empty', () => {
    const brief = { ...BASE_BRIEF, interests: [] }
    const { preferences } = classifyTripBrief(brief)
    expect(preferences.filter((p) => p.category === 'activity')).toHaveLength(0)
  })
})

describe('pace preference', () => {
  it('always emits a pace preference', () => {
    const { preferences } = classifyTripBrief(BASE_BRIEF)
    const p = preferences.find((x) => x.category === 'pace')
    expect(p).toBeDefined()
    expect(p?.text).toBe('moderate pace')
  })

  it('reflects the actual pace value', () => {
    const brief = { ...BASE_BRIEF, pace: 'relaxed' as const }
    const { preferences } = classifyTripBrief(brief)
    expect(preferences.find((x) => x.category === 'pace')?.text).toBe('relaxed pace')
  })
})

describe('dietary preference', () => {
  it('emits a dietary preference when dietaryPreferences is set', () => {
    const brief = { ...BASE_BRIEF, dietaryPreferences: 'vegetarian' }
    const { preferences } = classifyTripBrief(brief)
    expect(preferences.find((p) => p.id === 'dietary')?.text).toBe('vegetarian')
  })

  it('does not emit a dietary preference when dietaryPreferences is null', () => {
    const { preferences } = classifyTripBrief(BASE_BRIEF)
    expect(preferences.find((p) => p.id === 'dietary')).toBeUndefined()
  })
})

// ─── Separation invariants ────────────────────────────────────────────────────

describe('constraint vs preference separation', () => {
  it('no item appears in both constraints and preferences', () => {
    const brief = {
      ...BASE_BRIEF,
      transportationConstraints: ['no rental car'],
      accessibilityNeeds: 'wheelchair accessible',
      dietaryPreferences: 'vegan',
    }
    const { constraints, preferences } = classifyTripBrief(brief)
    const constraintIds = new Set(constraints.map((c) => c.id))
    const preferenceIds = new Set(preferences.map((p) => p.id))
    for (const id of constraintIds) {
      expect(preferenceIds.has(id)).toBe(false)
    }
  })

  it('all constraints have source user', () => {
    const { constraints } = classifyTripBrief(BASE_BRIEF)
    expect(constraints.every((c) => c.source === 'user')).toBe(true)
  })
})
