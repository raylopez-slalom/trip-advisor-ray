# Development Brief — Phase 2: Data Model and Catalog

**Source**: `docs/implementation-plan.md` Phase 2 (tasks 2.1–2.5), `docs/data-model.md`

## What to build

Shared TypeScript interfaces, Zod runtime schemas, a curated JSON catalog of 3–5 destinations, a catalog loader with stale-data detection, and unit tests covering schema validation and staleness logic. This unblocks all subsequent phases — Phase 3 (Trip Brief UI) and Phase 4 (Bedrock integration) both import from `packages/shared`.

## Acceptance criteria

- [ ] All TypeScript interfaces from `docs/data-model.md` compile under strict TS in `packages/shared`: `TripBrief`, `Constraint`, `Preference`, `Destination`, `CostLine`, `Source`, `Itinerary`, `Day`, `Activity`, `Meal`, `FreePeriod`, `BudgetEstimate`, `ChangeSnapshot`, `ItineraryDiff`, `ConstraintCheckResult`, `CatalogDestination`, `FlightEstimate`, `AccommodationEstimate`, `CostRange`, `SeasonalNote`, plus union types `BudgetCategory`, `Interest`, `ConstraintType`
- [ ] One Zod schema per interface; schemas are the runtime source of truth; inferred TypeScript types from schemas match the hand-written interfaces
- [ ] JSON catalog: 3–5 destinations, each with `FlightEstimate[]`, `AccommodationEstimate[]`, `activityCostRange`, `mealCostRange`, `localTransportCostRange`, `seasonalNotes`, `lastReviewed`, `reviewedBy`; all sources include `label`, `url`, `dateChecked`
- [ ] Catalog loader: reads `catalog/destinations.json`, returns `CatalogDestination[]`; marks sources with `dateChecked` > 90 days as `isStale: true`
- [ ] Zod unit tests: valid inputs parse cleanly; invalid inputs (missing required fields, wrong types, bad ISO dates) are rejected with descriptive errors
- [ ] Stale-data unit tests: `dateChecked` exactly at 90 days is NOT stale; `dateChecked` at 91 days IS stale; boundary and edge cases covered
- [ ] `npm run typecheck`, `npm run lint`, `npm run test` all pass at repo root

## What NOT to build

- UI components (Phase 3)
- Bedrock integration or AI prompts (Phase 4)
- A database or API endpoint for the catalog
- User authentication or accounts

## Files affected

| File | Change |
|------|--------|
| `packages/shared/package.json` | Add `zod` dep, `vitest` devDep, `test` script |
| `packages/shared/src/types.ts` | New — all TypeScript interfaces and union types |
| `packages/shared/src/schemas.ts` | New — all Zod schemas |
| `packages/shared/src/catalog.ts` | New — loader function and `isStale` helper |
| `packages/shared/src/index.ts` | Update to re-export everything |
| `packages/shared/src/types.test.ts` | New — Zod parse/reject unit tests |
| `packages/shared/src/catalog.test.ts` | New — stale-data detection unit tests |
| `catalog/destinations.json` | New at repo root — 3–5 curated entries |
| `packages/shared/vite.config.ts` | New — Vitest config for shared package |

## Approach

Define all TypeScript interfaces in `types.ts`, then corresponding Zod schemas in `schemas.ts`. Use `z.infer<typeof XxxSchema>` as the runtime type and verify it is assignable to the hand-written interface. The catalog loader uses `date-fns` `differenceInDays` to compute staleness. Five pilot destinations: Mexico City, Lisbon, Tokyo, Cancún, Nashville.

## Assumptions

- **Destinations**: Mexico City, Lisbon, Tokyo, Cancún, Nashville chosen as pilot examples. Product owner has not yet specified which destinations the pilot supports.
- **Sources**: Google Flights, Booking.com, TripAdvisor, official tourism sites. Product owner has not yet specified permitted sources.
- **Departure hubs**: NYC (JFK), LAX, ORD, MIA as flight origin hubs.
- **Currency**: USD throughout. Internationalisation deferred to post-pilot.

## Definition of done

- All acceptance criteria checked off
- `/spec-check` passes
- `/code-review` passes (no BLOCKING findings)
- `/preflight` passes
