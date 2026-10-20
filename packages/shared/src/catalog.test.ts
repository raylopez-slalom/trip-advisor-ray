import { describe, it, expect } from 'vitest'
import { isStale, applyStaleFlags } from './catalog.js'
import type { CatalogDestination } from './types.js'

const TODAY = new Date('2026-10-20')

describe('isStale', () => {
  it('returns false when dateChecked is today', () => {
    expect(isStale('2026-10-20', TODAY)).toBe(false)
  })

  it('returns false when dateChecked is exactly 90 days ago', () => {
    // 90 days before 2026-10-20 = 2026-07-22
    expect(isStale('2026-07-22', TODAY)).toBe(false)
  })

  it('returns true when dateChecked is 91 days ago', () => {
    // 91 days before 2026-10-20 = 2026-07-21
    expect(isStale('2026-07-21', TODAY)).toBe(true)
  })

  it('returns true when dateChecked is one year ago', () => {
    expect(isStale('2025-10-20', TODAY)).toBe(true)
  })

  it('returns false when dateChecked is yesterday', () => {
    expect(isStale('2026-10-19', TODAY)).toBe(false)
  })

  it('returns false when dateChecked is 89 days ago', () => {
    // 89 days before 2026-10-20 = 2026-07-23
    expect(isStale('2026-07-23', TODAY)).toBe(false)
  })
})

const freshSource = {
  label: 'Test Source',
  url: null,
  dateChecked: '2026-10-20',
  isStale: false,
}

const staleSource = {
  label: 'Old Source',
  url: null,
  dateChecked: '2025-06-01',
  isStale: false,
}

function makeDestination(overrides: Partial<CatalogDestination> = {}): CatalogDestination {
  const costRange = { low: 10, high: 50, currency: 'USD', source: freshSource }
  return {
    id: 'test-dest',
    name: 'Test Destination',
    region: 'Test Region',
    country: 'Test Country',
    tags: [],
    goodFor: [],
    notIdealFor: [],
    flightFromHubs: [
      {
        fromCity: 'New York',
        fromIata: 'JFK',
        roundTripRangeLow: 300,
        roundTripRangeHigh: 600,
        currency: 'USD',
        source: freshSource,
        notes: null,
      },
    ],
    typicalAccommodation: [
      {
        type: 'mid-range-hotel',
        perNightRangeLow: 100,
        perNightRangeHigh: 200,
        currency: 'USD',
        source: freshSource,
      },
    ],
    activityCostRange: { ...costRange },
    mealCostRange: { ...costRange },
    localTransportCostRange: { ...costRange },
    seasonalNotes: [
      {
        months: [6, 7, 8],
        summary: 'Summer',
        source: freshSource,
      },
    ],
    lastReviewed: '2026-10-20',
    reviewedBy: 'RL',
    ...overrides,
  }
}

describe('applyStaleFlags', () => {
  it('leaves fresh sources with isStale: false', () => {
    const dest = makeDestination()
    const result = applyStaleFlags([dest], TODAY)
    expect(result[0]?.flightFromHubs[0]?.source.isStale).toBe(false)
    expect(result[0]?.activityCostRange.source.isStale).toBe(false)
  })

  it('marks stale flight sources as isStale: true', () => {
    const dest = makeDestination({
      flightFromHubs: [
        {
          fromCity: 'New York',
          fromIata: 'JFK',
          roundTripRangeLow: 300,
          roundTripRangeHigh: 600,
          currency: 'USD',
          source: staleSource,
          notes: null,
        },
      ],
    })
    const result = applyStaleFlags([dest], TODAY)
    expect(result[0]?.flightFromHubs[0]?.source.isStale).toBe(true)
  })

  it('marks stale accommodation sources as isStale: true', () => {
    const dest = makeDestination({
      typicalAccommodation: [
        {
          type: 'mid-range-hotel',
          perNightRangeLow: 100,
          perNightRangeHigh: 200,
          currency: 'USD',
          source: staleSource,
        },
      ],
    })
    const result = applyStaleFlags([dest], TODAY)
    expect(result[0]?.typicalAccommodation[0]?.source.isStale).toBe(true)
  })

  it('marks stale activity cost range source as isStale: true', () => {
    const dest = makeDestination({
      activityCostRange: { low: 10, high: 50, currency: 'USD', source: staleSource },
    })
    const result = applyStaleFlags([dest], TODAY)
    expect(result[0]?.activityCostRange.source.isStale).toBe(true)
  })

  it('marks stale meal cost range source as isStale: true', () => {
    const dest = makeDestination({
      mealCostRange: { low: 10, high: 50, currency: 'USD', source: staleSource },
    })
    const result = applyStaleFlags([dest], TODAY)
    expect(result[0]?.mealCostRange.source.isStale).toBe(true)
  })

  it('marks stale local transport cost range source as isStale: true', () => {
    const dest = makeDestination({
      localTransportCostRange: { low: 5, high: 20, currency: 'USD', source: staleSource },
    })
    const result = applyStaleFlags([dest], TODAY)
    expect(result[0]?.localTransportCostRange.source.isStale).toBe(true)
  })

  it('marks stale seasonal note source as isStale: true', () => {
    const dest = makeDestination({
      seasonalNotes: [{ months: [6], summary: 'Summer', source: staleSource }],
    })
    const result = applyStaleFlags([dest], TODAY)
    expect(result[0]?.seasonalNotes[0]?.source.isStale).toBe(true)
  })

  it('does not mutate the input array', () => {
    const dest = makeDestination()
    const input = [dest]
    applyStaleFlags(input, TODAY)
    expect(input[0]?.flightFromHubs[0]?.source).toBe(dest.flightFromHubs[0]?.source)
  })

  it('processes multiple destinations independently', () => {
    const fresh = makeDestination({ id: 'fresh' })
    const stale = makeDestination({
      id: 'stale',
      activityCostRange: { low: 10, high: 50, currency: 'USD', source: staleSource },
    })
    const result = applyStaleFlags([fresh, stale], TODAY)
    expect(result[0]?.activityCostRange.source.isStale).toBe(false)
    expect(result[1]?.activityCostRange.source.isStale).toBe(true)
  })
})
