# ADR 001 — Separate AI model from travel data

**Status**: Accepted  
**Date**: 2026-10-19

---

## Context

An LLM trained on historical data cannot reliably supply current prices, opening hours, or availability. If the AI model is treated as a data source, the system will confidently produce outdated or fabricated figures — and users may act on them.

This matters more for a travel advisor than for many AI applications: a user who books a trip based on a hallucinated price suffers a real financial consequence.

---

## Decision

The AI model (Claude) is responsible only for:
- Interpreting preferences and constraints
- Proposing options and explaining trade-offs
- Generating itinerary structure

Travel facts (prices, hours, availability, seasonal conditions) are supplied exclusively by the **travel data layer** — a curated catalog during the pilot, optionally supplemented by live APIs later.

The AI model receives catalog data as input in the prompt and reasons over it. It does not retrieve or generate travel facts from its own knowledge.

---

## Consequences

**Positive**
- All travel facts are traceable to a source and a verification date
- The system can honestly label everything as an estimate
- Stale data is detectable (by checking `dateChecked` against today)
- If a destination is not in the catalog, the system says so rather than hallucinating one

**Negative**
- The pilot is limited to destinations in the curated catalog
- The catalog must be maintained by a human curator; it will go stale without upkeep
- Adding a new destination requires a human review, not just a prompt change

**Neutral**
- Live data integrations (flight search, hotel pricing) are a future option, not a pilot requirement
- The catalog approach lets us test recommendation quality before committing to live API dependencies

---

## Rejected alternatives

**Let the model supply prices from its training data**  
Rejected: training data is a point-in-time snapshot; prices, hours, and availability change. The risk of confident, wrong answers is too high.

**Retrieve live prices for every request**  
Rejected for pilot: adds API dependencies, rate limits, and cost before the core recommendation flow is validated. Deferred to post-pilot.
