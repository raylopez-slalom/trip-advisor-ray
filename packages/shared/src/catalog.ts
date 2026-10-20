import { readFileSync } from 'node:fs'
import { differenceInCalendarDays } from 'date-fns'
import { CatalogDestinationSchema } from './schemas.js'
import type { CatalogDestination, Source } from './types.js'

export function isStale(dateChecked: string, today: Date = new Date()): boolean {
  const checked = new Date(dateChecked)
  return differenceInCalendarDays(today, checked) > 90
}

export function applyStaleFlags(
  destinations: CatalogDestination[],
  today: Date = new Date(),
): CatalogDestination[] {
  return destinations.map((dest) => ({
    ...dest,
    flightFromHubs: dest.flightFromHubs.map((f) => ({
      ...f,
      source: withStale(f.source, today),
    })),
    typicalAccommodation: dest.typicalAccommodation.map((a) => ({
      ...a,
      source: withStale(a.source, today),
    })),
    activityCostRange: {
      ...dest.activityCostRange,
      source: withStale(dest.activityCostRange.source, today),
    },
    mealCostRange: {
      ...dest.mealCostRange,
      source: withStale(dest.mealCostRange.source, today),
    },
    localTransportCostRange: {
      ...dest.localTransportCostRange,
      source: withStale(dest.localTransportCostRange.source, today),
    },
    seasonalNotes: dest.seasonalNotes.map((s) => ({
      ...s,
      source: withStale(s.source, today),
    })),
  }))
}

function withStale(source: Source, today: Date): Source {
  return { ...source, isStale: isStale(source.dateChecked, today) }
}

export function loadCatalog(catalogPath: string, today: Date = new Date()): CatalogDestination[] {
  const raw: unknown = JSON.parse(readFileSync(catalogPath, 'utf-8'))
  const parsed = CatalogDestinationSchema.array().parse(raw)
  return applyStaleFlags(parsed, today)
}
