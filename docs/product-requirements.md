# Product Requirements

## Purpose

Travel AI Advisor is a conversational travel-planning assistant that turns a trip idea into a feasible, constraint-aware itinerary. It is a decision-support tool, not a booking platform.

---

## Core user flows

### Flow A — Describe your trip

Users open the Trip Brief view and provide:

| Input | Type |
|-------|------|
| Departure city | Required |
| Travel dates or duration | Required |
| Number of travelers (adults / children) | Required |
| Total budget and what it covers | Required — must be clarified if ambiguous |
| Interests (food, nature, culture, etc.) | Required |
| Preferred pace (relaxed / moderate / active) | Required |
| Transportation preferences | Required |
| Accessibility needs | Optional |
| Dietary preferences | Optional |

**Constraint vs. preference distinction**

The advisor classifies every input before planning. Hard constraints are never violated silently; preferences may be traded off with a clear explanation.

| Example input | Classification |
|---------------|----------------|
| "no rental car" | Hard constraint |
| "five days" | Hard constraint |
| "$2,500 total" | Hard constraint — clarify if it includes flights |
| "hotel near restaurants" | Preference |
| "more outdoor activities" | Preference |

When a budget figure is ambiguous (does it include flights?), the advisor asks before proceeding. It never silently assumes.

---

### Flow B — Compare destinations

After receiving the trip brief, the advisor proposes up to **three destination options**. Each is presented as a destination card containing:

- Why this destination fits the stated constraints and preferences
- Estimated cost breakdown (flights, accommodation, activities, meals, transport)
- Trade-offs vs. the other options
- Weather and seasonality notes, with source and date checked
- Uncertainties the user should verify before booking
- Information sources

Users should understand *why* an option fits — not just receive an enthusiastic headline.

**Budget constraint rule**: if no destination fits the budget, the advisor says so and offers adjustments (extend dates, relax a preference, reduce trip length). It does not invent lower prices.

---

### Flow C — Build an itinerary

After the user selects a destination, the advisor produces:

- A day-by-day timeline
- Activities grouped by location (minimize transit time)
- Meal suggestions and free-time slots
- Transportation assumptions stated explicitly
- An estimated budget per day and in total
- Links or citations for each recommendation

**Pilot scope**: timeline and comparison views are the first release. A map view is a later enhancement.

---

### Flow D — Refine without losing constraints

Users may refine the itinerary conversationally or through controls:

- Lower the budget
- Slow the pace
- Replace a specific activity
- Add a free afternoon
- Remove a transportation mode

After any change, the advisor:

1. Rechecks the *entire* plan against all hard constraints — not just the changed section
2. Shows a **change summary**: what was replaced, added, or removed, and the budget impact
3. Flags any constraint that is now at risk

Example summary:
> "Replaced two paid activities and added a free afternoon. Estimated activity costs decreased by $60. Accommodation and transportation estimates are unchanged."

---

## Non-negotiable product rules

These rules apply to every AI-generated response in the system. They are not configurable.

1. **Budget honesty** — if no plan fits the constraints, say so and offer adjustments. Never adjust prices to make the answer fit.
2. **Estimate labeling** — all costs are labeled as estimates. An estimate is not a quote; a recommendation is not confirmed availability; an itinerary is not a reservation.
3. **Source transparency** — every travel fact (price range, opening hours, transit time) is accompanied by its source and the date it was checked.
4. **Constraint integrity** — hard constraints are never silently violated. If a constraint makes a destination impossible, the advisor explains why and asks whether the constraint can be relaxed.
5. **Full-plan recheck on change** — refinement rechecks the whole itinerary, not just the paragraph being rewritten.
6. **Clarify before assuming** — when a user input is ambiguous (e.g., whether a budget includes flights), ask rather than decide.

---

## Out of scope (pilot)

- Live flight or hotel pricing APIs
- Booking or reservation functionality
- Real-time availability
- Map view
- User accounts or saved itineraries (unless added post-pilot)
