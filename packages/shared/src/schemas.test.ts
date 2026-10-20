import { describe, it, expect } from 'vitest'
import {
  TripBriefSchema,
  ConstraintSchema,
  SourceSchema,
  CostLineSchema,
  DestinationSchema,
  CatalogDestinationSchema,
  BudgetCategorySchema,
  InterestSchema,
  ConstraintTypeSchema,
} from './schemas.js'

const validSource = {
  label: 'Google Flights',
  url: 'https://www.google.com/travel/flights',
  dateChecked: '2026-10-20',
  isStale: false,
}

describe('SourceSchema', () => {
  it('parses a valid source', () => {
    expect(() => SourceSchema.parse(validSource)).not.toThrow()
  })

  it('accepts null url', () => {
    expect(() => SourceSchema.parse({ ...validSource, url: null })).not.toThrow()
  })

  it('rejects a non-ISO dateChecked', () => {
    expect(() =>
      SourceSchema.parse({ ...validSource, dateChecked: 'October 20, 2026' }),
    ).toThrow()
  })

  it('rejects a missing label', () => {
    expect(() =>
      SourceSchema.parse({ url: null, dateChecked: '2026-10-20', isStale: false }),
    ).toThrow()
  })

  it('rejects an invalid URL', () => {
    expect(() =>
      SourceSchema.parse({ ...validSource, url: 'not-a-url' }),
    ).toThrow()
  })
})

const validCostLine = {
  category: 'flights' as const,
  estimateLow: 300,
  estimateHigh: 600,
  currency: 'USD',
  perUnit: 'total' as const,
  note: null,
  source: validSource,
}

describe('CostLineSchema', () => {
  it('parses a valid cost line', () => {
    expect(() => CostLineSchema.parse(validCostLine)).not.toThrow()
  })

  it('rejects an unknown category', () => {
    expect(() =>
      CostLineSchema.parse({ ...validCostLine, category: 'visa-fees' }),
    ).toThrow()
  })

  it('rejects a negative estimateLow', () => {
    expect(() =>
      CostLineSchema.parse({ ...validCostLine, estimateLow: -10 }),
    ).toThrow()
  })

  it('rejects a currency that is not 3 characters', () => {
    expect(() =>
      CostLineSchema.parse({ ...validCostLine, currency: 'US' }),
    ).toThrow()
  })
})

const validTripBrief = {
  departureCity: 'New York',
  startDate: '2027-03-01',
  endDate: '2027-03-08',
  durationDays: null,
  travelers: { adults: 2, children: 0 },
  budget: {
    amount: 4000,
    currency: 'USD',
    includes: ['flights', 'accommodation'],
    clarified: true,
  },
  interests: ['food', 'culture'],
  pace: 'moderate',
  transportationConstraints: [],
  accessibilityNeeds: null,
  dietaryPreferences: null,
}

describe('TripBriefSchema', () => {
  it('parses a valid trip brief', () => {
    expect(() => TripBriefSchema.parse(validTripBrief)).not.toThrow()
  })

  it('rejects zero adults', () => {
    expect(() =>
      TripBriefSchema.parse({
        ...validTripBrief,
        travelers: { adults: 0, children: 0 },
      }),
    ).toThrow()
  })

  it('rejects an invalid pace', () => {
    expect(() =>
      TripBriefSchema.parse({ ...validTripBrief, pace: 'sprint' }),
    ).toThrow()
  })

  it('rejects a non-ISO-4217 currency (wrong length)', () => {
    expect(() =>
      TripBriefSchema.parse({
        ...validTripBrief,
        budget: { ...validTripBrief.budget, currency: 'USDD' },
      }),
    ).toThrow()
  })

  it('rejects an unknown interest', () => {
    expect(() =>
      TripBriefSchema.parse({ ...validTripBrief, interests: ['surfing'] }),
    ).toThrow()
  })

  it('rejects a negative budget amount', () => {
    expect(() =>
      TripBriefSchema.parse({
        ...validTripBrief,
        budget: { ...validTripBrief.budget, amount: -100 },
      }),
    ).toThrow()
  })

  it('rejects a malformed startDate', () => {
    expect(() =>
      TripBriefSchema.parse({ ...validTripBrief, startDate: '2027/03/01' }),
    ).toThrow()
  })
})

describe('ConstraintSchema', () => {
  it('parses a valid constraint', () => {
    expect(() =>
      ConstraintSchema.parse({
        id: 'c1',
        text: 'no rental car',
        type: 'no-rental-car',
        source: 'user',
      }),
    ).not.toThrow()
  })

  it('rejects an unknown constraint type', () => {
    expect(() =>
      ConstraintSchema.parse({
        id: 'c1',
        text: 'no ferries',
        type: 'no-ferries',
        source: 'user',
      }),
    ).toThrow()
  })
})

describe('BudgetCategorySchema', () => {
  const valid: string[] = ['flights', 'accommodation', 'activities', 'meals', 'transport', 'other']

  it.each(valid)('accepts "%s"', (cat) => {
    expect(() => BudgetCategorySchema.parse(cat)).not.toThrow()
  })

  it('rejects an unlisted category', () => {
    expect(() => BudgetCategorySchema.parse('visa')).toThrow()
  })
})

describe('InterestSchema', () => {
  it('accepts all defined interests', () => {
    const interests = [
      'food', 'nature', 'culture', 'history',
      'nightlife', 'outdoor-adventure', 'wellness', 'family-friendly',
    ]
    interests.forEach((i) => {
      expect(() => InterestSchema.parse(i)).not.toThrow()
    })
  })

  it('rejects an unlisted interest', () => {
    expect(() => InterestSchema.parse('surfing')).toThrow()
  })
})

describe('ConstraintTypeSchema', () => {
  it('rejects an unlisted type', () => {
    expect(() => ConstraintTypeSchema.parse('no-ferries')).toThrow()
  })
})

describe('CatalogDestinationSchema', () => {
  it('rejects a destination missing required fields', () => {
    expect(() => CatalogDestinationSchema.parse({ id: 'x', name: 'X' })).toThrow()
  })
})

describe('DestinationSchema', () => {
  it('rejects a destination missing budgetFitsConstraint', () => {
    expect(() =>
      DestinationSchema.parse({
        id: 'd1',
        name: 'Test',
        region: 'Europe',
        country: 'Portugal',
        whyItFits: 'great',
        tradeOffs: 'none',
        costBreakdown: [],
        budgetDelta: null,
        weatherNotes: 'sunny',
        weatherSource: validSource,
        uncertainties: [],
        sources: [],
      }),
    ).toThrow()
  })
})
