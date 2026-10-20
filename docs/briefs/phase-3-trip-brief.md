# Development Brief — Phase 3: Trip Brief (View 1)

Source: docs/implementation-plan.md (Phase 3, tasks 3.1–3.7)
        docs/ui-guidelines.md §View 1
        docs/product-requirements.md §Flow A
        docs/testing-guidelines.md §AC-1

## What to build

A structured form (View 1) where users enter their trip parameters. On submit,
each input is classified as a hard Constraint (red chip) or soft Preference
(blue chip). If the budget amount is entered without specifying whether it
includes flights, a clarification prompt blocks the proceed button until the
user answers Yes or No. The view is self-contained — no Bedrock calls, no API.

## Acceptance criteria

- [ ] All required fields present: departure city, travel dates/duration,
      traveler count (adults + children counters), total budget + what it
      covers (checklist), interests (multi-select), pace (segmented control),
      transportation preferences (multi-select)
- [ ] Optional fields present but never required: accessibility needs, dietary
      preferences (freeform)
- [ ] Submit is disabled (or shows inline errors) until all required fields
      pass Zod validation
- [ ] Budget clarification prompt appears when a budget amount is entered but
      flight inclusion is unselected — AC-1 scenario
- [ ] "Unsure" option blocks proceed; "Yes" or "No" allows it
- [ ] Each submitted input displays as a ConstraintChip (red) or
      PreferenceChip (blue) — color + icon, never color alone
- [ ] Constraint chips and preference chips render the correct lists with no
      type mix-ups
- [ ] Editing any field after submission shows a recalculation warning

## What NOT to build

- No API calls — classifier and form are entirely client-side this phase
- No navigation to View 2 — routing is Phase 6
- No Bedrock integration — that is Phase 4
- Do not implement the constraint strip above Itinerary Workspace — Phase 6

## Files likely affected

- `packages/web/src/components/TripBriefForm.tsx` — new
- `packages/web/src/components/ConstraintChip.tsx` — new
- `packages/web/src/components/PreferenceChip.tsx` — new
- `packages/web/src/lib/classifier.ts` — new; classifies each input field
- `packages/web/src/App.tsx` — wire in TripBriefForm
- `packages/shared/src/schemas.ts` — verify TripBriefSchema covers all form
  fields; extend if needed

## Approach

Build TripBriefForm as a controlled React component backed by local state;
validate on submit with the existing TripBriefSchema from packages/shared.
The classifier is a pure function (input field value + field name →
`'constraint' | 'preference' | 'needs-clarification'`); map the known fields
from product-requirements.md to their classification, defaulting to preference
for unrecognized inputs. ConstraintChip and PreferenceChip are simple
presentational components — red vs. blue with an icon. The budget clarification
prompt is inline state in the form (no separate route).

## Assumptions

- Transportation restrictions and fixed duration are always hard constraints;
  interests, pace, accessibility, and dietary are preferences. Confirm with
  product owner before PR.
- "Editing a field shows recalculation warning" renders a static inline message
  after first submit — no async call this phase.
- TripBriefSchema in packages/shared covers all form fields. If not, extend
  it rather than duplicating validation in the component.

## Definition of done

- All acceptance criteria checked off
- AC-1 passes manually (budget clarification blocks proceed on Unsure)
- Constraint chips render red; preference chips render blue — verified visually
- /spec-check passes
- /code-review passes (no BLOCKING findings)
- /preflight passes
