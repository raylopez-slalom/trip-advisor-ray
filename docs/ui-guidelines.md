# UI Guidelines

## Design principle

The product must feel like a structured tool, not a chatbot. Users should never need to scroll through conversation history to find their current budget, itinerary, or constraints.

**Structured views hold the plan state. Conversation expresses intent.**

---

## Tech foundation

- **Framework**: React + TypeScript
- **Build tool**: Vite
- **Styling**: Tailwind CSS
- **Component tests**: React Testing Library + Vitest
- **End-to-end tests**: Playwright

---

## Three-view layout

The UI has three connected views. Users move through them in order during initial planning; they can return to earlier views to adjust inputs.

```
┌─────────────────────────────────────────────────────────┐
│  [ Trip Brief ]  →  [ Destinations ]  →  [ Itinerary ]  │
│   Step indicator always visible in the top nav           │
└─────────────────────────────────────────────────────────┘
```

The current brief, budget, and itinerary must remain visible in structured views at all times. Users must not have to search conversation history to find them.

---

### View 1 — Trip Brief

**Purpose**: collect and display the user's trip parameters in an editable, structured form.

**Required fields** (advisor prompts for missing required input before proceeding):
- Departure city
- Travel dates or duration
- Number of travelers (adults + children counters)
- Total budget — amount, currency, and what it covers (flights / accommodation / activities / meals checklist)
- Interests (multi-select tags: food, nature, culture, history, nightlife, outdoor adventure, wellness, family-friendly)
- Preferred pace (segmented control: Relaxed / Moderate / Active)
- Transportation preferences and restrictions (multi-select: no rental car, public transit only, no long flights, etc.)

**Optional fields** (never required; do not claim a venue meets a need without supporting information):
- Accessibility needs (freeform)
- Dietary preferences (freeform)

**Budget clarification**: when the budget amount is entered, a helper appears — "Does this include flights?" with Yes / No / Unsure. If Unsure, the advisor asks conversationally before proposing destinations. The advisor never silently interprets an unclear budget as including or excluding flights.

**Constraint / preference classification**: once the form is submitted, each input is displayed with a badge — **Constraint** (hard, red) or **Preference** (soft, blue). Users can promote a Preference to a Constraint or demote a Constraint to a Preference. The advisor separates and displays these lists throughout the session.

**Returning to this view**: editing any field re-triggers the planning flow. The user is shown what will be recalculated before confirming.

---

### View 2 — Destination Comparison

**Purpose**: present up to three destination options side-by-side so users can evaluate and choose.

**Card count rule**: show only options that meet all known hard constraints. If fewer than three catalog entries qualify, show fewer — do not fill the list with unsuitable options.

**Each destination card**:

| Section | Content |
|---------|---------|
| Destination name | |
| Why it fits | 2–3 sentences explaining how it matches the constraints and preferences |
| Cost breakdown | Itemized table by category (flights, accommodation, activities, meals, transport), each as a range (low–high), labeled per person / per night / total as applicable |
| Budget status | "Fits your $X,XXX budget" or "Exceeds budget by ~$XXX — adjustments needed" |
| Excluded costs | Any required cost category not covered or unknown is shown explicitly — not treated as zero |
| Trade-offs | What this destination cannot fully satisfy from the preferences |
| Weather | Season summary for the travel dates — distinguish seasonal guidance from a forecast for specific dates; show source and date checked |
| Uncertainties | Bulleted list of things the user needs to verify before booking |
| Sources | Collapsible list with source names, URLs (where available), and dates checked |

**No-match behavior**: if no catalog destination fits the budget or another hard constraint, display a clear explanation and offer explicit adjustments (change dates, destination, duration, or budget). Do not apply adjustments without the user's agreement.

**Source freshness**: cost data older than 90 days shows a warning icon. The tooltip shows the check date and advises verification.

---

### View 3 — Itinerary Workspace

**Purpose**: display the day-by-day itinerary alongside a budget summary, with a refinement conversation panel.

**Layout** (two-column on desktop, stacked on mobile):

```
┌──────────────────────────┬─────────────────────────┐
│   Itinerary timeline     │   Refinement panel      │
│                          │                         │
│  Day 1 ──────────────    │  Budget summary         │
│    Morning: ...          │  ─────────────────────  │
│    Lunch: ...            │  Conversation input     │
│    Afternoon: ...        │  + recent exchanges     │
│    Dinner: ...           │                         │
│                          │                         │
│  Day 2 ──────────────    │                         │
│    ...                   │                         │
└──────────────────────────┴─────────────────────────┘
```

**Itinerary timeline**:
- Each day is a card with morning / afternoon / evening sections
- Activities show: name, duration, estimated cost with source, location, and any unresolved practical detail
- Transportation between activities is shown inline; transportation assumptions are stated explicitly
- Free periods are explicitly labeled — not left as empty space
- Meal suggestions are included per period; alternatives are accessible on tap/click

**Do not present uncertain details as verified facts**: opening hours, travel times, prices, or accessibility details that cannot be confirmed from a source are labeled as unverified. Unresolved practical details are disclosed, not hidden.

**Budget summary panel**:
- Running total by category (flights, accommodation, activities, meals, transport)
- Total vs. budget ceiling with a progress bar
- Excluded or unknown cost categories remain visibly unknown — they are not omitted or treated as zero
- "Estimated" label is always present — costs are never shown as confirmed prices

**Refinement panel**:
- Freeform text input for conversational changes: "Make day 2 less busy", "Add a free afternoon on day 3", "What changes if we bring our child?"
- Structured editing controls for common changes (lower budget, swap activity, change pace)
- After each refinement, a **change summary** appears before the conversation input:
  > "Replaced two paid activities and added a free afternoon. Estimated activity costs decreased. Accommodation and transportation estimates are unchanged."
- The timeline is the source of truth — conversation history is secondary
- If a requested change conflicts with a hard constraint, the advisor explains the conflict and asks which requirement should change — it does not silently drop the constraint or silently ignore the request

---

## Component patterns

### Estimate badge
All monetary figures carry an **Estimate** badge. On hover/tap: source name, date checked, cost basis (per person / per night / total).

```
$1,200–1,500  [Estimate ⓘ]
```

### Constraint chip
Hard constraints are shown as red chips; preferences as blue chips. Both appear in the Trip Brief and persist as a summary strip above the Itinerary Workspace.

```
[✗ No rental car]  [✗ 5 days]  [~ Hotel near restaurants]  [~ More outdoor activities]
```

### Change summary banner
Appears after every refinement. Disappears when the user makes another change or dismisses it. Includes relevant costs that changed **and** those that stayed the same.

```
┌──────────────────────────────────────────────────────────┐
│  Change summary: Replaced Museum visit with Farmers'     │
│  Market (free). Added free afternoon on Day 3.           │
│  Activity costs: −$45. Accommodation and transport:      │
│  unchanged. Budget at $2,310 / $2,500.                   │
└──────────────────────────────────────────────────────────┘
```

### Unverified detail label
Facts that cannot be confirmed from a source are labeled inline:

```
Opening hours: 9am–5pm  [Unverified — confirm before visiting ⚠]
```

### Error state
When the API returns an invalid or unparseable result, show an explicit error message and preserve the previous valid plan. Never show raw model output.

---

## Accessibility

- All interactive elements are keyboard-navigable
- Color is never the only indicator (use icon + label for constraint type, estimate, stale data, unverified)
- Estimate and source labels are screen-reader-friendly (`aria-label` on badge icons)
- Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (WCAG AA)
- Date pickers include a text input fallback
- Product accessibility requirements must be confirmed before implementation; travel accessibility preferences collected from users are separate from accessible product controls

---

## Responsive behavior

| Breakpoint | Layout |
|------------|--------|
| Mobile (< 640px) | Single column; Itinerary Workspace stacks timeline above refinement panel |
| Tablet (640–1024px) | Two columns in Itinerary Workspace; destination cards scroll horizontally |
| Desktop (> 1024px) | Full three-view flow; destination cards side-by-side |

---

## Copy and tone guidelines

- Use plain, direct language — no travel marketing superlatives
- Always distinguish estimate from confirmed: "estimated cost", "based on [source]", "planning estimate — not a quote"
- An estimate is not a quote. A recommendation is not confirmed availability. An itinerary is not a reservation. These phrases appear wherever a user assesses a recommendation.
- When the advisor cannot meet a constraint, say so directly: "No destination in the catalog fits a $1,500 budget for two adults flying from Chicago for five days in May. Here are the closest options and what would need to change."
- Change summaries use concrete numbers and name costs that stayed the same as well as those that changed
- Do not claim a venue meets an accessibility or dietary need without supporting source information

---

## Privacy and data collection

- Collect only information needed for planning: departure city, dates, traveler count, budget, interests, pace, transport preferences
- Do not collect passport details or payment information — outside this scope
- Accessibility needs and dietary preferences are optional and treated as sensitive
- Travel dates and optional personal details are potentially sensitive — data retention, sharing, and deletion rules require product owner agreement before implementation
