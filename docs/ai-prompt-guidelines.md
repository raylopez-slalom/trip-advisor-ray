# AI Prompt Guidelines

## Role of the AI model

The AI model (Claude) interprets natural-language preferences, proposes destination options with rationale, generates itinerary structures, and responds to refinement requests. It does **not** supply facts (prices, hours, availability) and does **not** perform arithmetic.

All Claude API calls go through the application logic layer. The UI never calls the model directly.

---

## System prompt structure

Every request to the model includes a system prompt that establishes:

1. The advisor's role and what it may and may not do
2. The non-negotiable rules (from product requirements)
3. The output format (structured JSON)
4. The data contract (facts come from the data layer, not the model)

### System prompt template

```
You are a travel-planning advisor. Your role is to interpret user preferences,
propose destination options with honest trade-off explanations, and generate
day-by-day itinerary structures.

Rules you must follow without exception:
1. Never invent prices, opening hours, or availability. Use only the travel
   data provided in the user message.
2. If no destination in the provided catalog fits the user's budget, say so
   clearly and suggest what would need to change. Do not adjust prices to
   make a plan fit.
3. Label every cost figure as an estimate. Never imply a figure is confirmed.
4. Hard constraints (marked [CONSTRAINT]) must never be violated. If honoring
   a constraint makes a plan impossible, explain why.
5. After any itinerary refinement, recheck the entire plan against all
   constraints — not just the changed section.
6. If a user input is ambiguous (e.g., whether a budget includes flights),
   ask for clarification rather than assuming.

Output format: respond only with valid JSON matching the schema in the user
message. No prose outside the JSON object.
```

---

## Prompt design rules

### Pass structured state, not narrative

Send the current plan state as a structured JSON object, not a prose summary. The model reasons better over structured inputs and produces more consistent outputs.

**Preferred**:
```json
{
  "tripBrief": {
    "departureCity": "Chicago",
    "durationDays": 5,
    "travelers": { "adults": 2, "children": 0 },
    "budget": { "amount": 2500, "currency": "USD", "includes": ["flights", "accommodation", "activities"] },
    "interests": ["food", "nature"],
    "pace": "moderate",
    "transportationConstraints": ["no-rental-car"]
  },
  "constraints": [
    { "type": "no-rental-car", "text": "no rental car" },
    { "type": "fixed-duration", "text": "5 days" },
    { "type": "budget-ceiling", "text": "$2,500 including flights and accommodation" }
  ],
  "catalog": [ ... ]
}
```

**Avoid**: "The user is two adults traveling from Chicago for five days in May with a $2,500 budget. They like food and nature and don't want to rent a car."

### Include the catalog data in the prompt

During the pilot phase, the full curated catalog (or the relevant subset) is passed in the `catalog` field of the user message. The model uses this data, not its training knowledge, for destination facts.

Each catalog entry includes source metadata:
```json
{
  "destination": "Asheville, NC",
  "typicalFlightFromChicago": { "rangeLow": 180, "rangeHigh": 320, "source": "Google Flights", "dateChecked": "2025-09-01" },
  "typicalHotelPerNight": { "rangeLow": 120, "rangeHigh": 200, "source": "Booking.com", "dateChecked": "2025-08-15" },
  ...
}
```

### Specify the output schema in the prompt

Include the exact JSON schema the model should return. This reduces parsing failures and makes validation straightforward.

```json
{
  "schema": "destination-proposals-v1",
  "proposals": [
    {
      "name": "string",
      "whyItFits": "string (2–3 sentences)",
      "costBreakdown": [
        { "category": "flights|accommodation|activities|meals|transport", "estimateLow": number, "estimateHigh": number, "source": "string", "dateChecked": "YYYY-MM-DD" }
      ],
      "tradeOffs": "string",
      "weatherNotes": "string",
      "uncertainties": ["string"],
      "sources": [{ "label": "string", "url": "string|null", "dateChecked": "YYYY-MM-DD" }]
    }
  ],
  "budgetNote": "string|null (null if all proposals fit the budget)"
}
```

---

## Refinement prompts

When the user requests a change, include:

1. The **current itinerary snapshot** (full JSON)
2. The **change request** (verbatim user text + any structured input from UI controls)
3. The **full constraints list** (unchanged)
4. A **recheck instruction**: "After making this change, verify that all constraints are still satisfied. If the change would violate a constraint, explain why and do not make it."

```json
{
  "task": "refine-itinerary",
  "currentItinerary": { ... },
  "changeRequest": "Make the second day less busy",
  "constraints": [ ... ],
  "instruction": "Return the revised itinerary. Include a changeSummary field listing what was added, removed, or replaced, and the budget delta. If the change would violate a constraint, return an error field instead."
}
```

---

## Handling model output

### Always parse before acting

```python
try:
    result = json.loads(response.content[0].text.strip())
except json.JSONDecodeError:
    # log the raw output, return a user-visible error
    raise ModelOutputParseError("Could not parse model response")
```

### Validate structure before using

Check that required fields are present before passing the result to the UI. A structurally invalid response should return a user-visible error and be logged, not crash or surface raw JSON.

### Never render raw model output

The model's text output is never rendered directly in the UI. It is always parsed, validated, and rendered through typed UI components.

---

## Prompt versioning

- Each prompt template is versioned (e.g., `destination-proposals-v1`)
- The version is included in the request and logged with the response
- When a prompt changes in a way that affects output structure, increment the version
- Golden-file regression tests pin to a prompt version; update them explicitly when upgrading

---

## Cost and latency guidance

- Destination proposal requests pass the full catalog; keep the catalog under 10,000 tokens per request during the pilot
- Itinerary generation is the most token-intensive call; target under 30 seconds for a first response
- Refinement requests include the full itinerary snapshot — monitor token usage as itineraries grow
- Use `max_tokens` to bound response length; set it generously enough not to truncate valid responses
