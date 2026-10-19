#!/usr/bin/env python3
"""
Create all implementation-plan tasks in JIRA.

Creates one Epic per phase, then one Story per task under each Epic.

Usage:
  export ATLASSIAN_URL=https://slalom-team-zhxx4q21.atlassian.net
  export ATLASSIAN_EMAIL=raymundo.lopez@slalom.com
  export ATLASSIAN_TOKEN=<your-api-token>
  python3 scripts/create_jira_tasks.py

Dry-run (prints what would be created, makes no API calls):
  python3 scripts/create_jira_tasks.py --dry-run
"""

import os
import sys
import json
import base64
import httpx

# ── Config ────────────────────────────────────────────────────────────────────

JIRA_URL   = os.environ.get("ATLASSIAN_URL", "https://slalom-team-zhxx4q21.atlassian.net")
EMAIL      = os.environ.get("ATLASSIAN_EMAIL", "raymundo.lopez@slalom.com")
TOKEN      = os.environ.get("ATLASSIAN_TOKEN", "")
PROJECT    = "SCRUM"
DRY_RUN    = "--dry-run" in sys.argv

AUTH = base64.b64encode(f"{EMAIL}:{TOKEN}".encode()).decode()
HEADERS = {
    "Authorization": f"Basic {AUTH}",
    "Content-Type": "application/json",
    "Accept": "application/json",
}

# ── Implementation plan ───────────────────────────────────────────────────────

PHASES = [
    {
        "name": "Phase 1 — Project Scaffold",
        "summary": "Deployable hello-world across all three packages with CI running on every PR.",
        "tasks": [
            ("1.1", "Initialize monorepo (packages/web, packages/api, packages/infra)", "Use npm workspaces or pnpm"),
            ("1.2", "Set up Vite + React + TypeScript + Tailwind in packages/web", "React 18, strict TS config"),
            ("1.3", "Set up Node.js + TypeScript for Lambda in packages/api", "ESM, strict TS, esbuild for bundling"),
            ("1.4", "Set up AWS CDK (TypeScript) in packages/infra", "CDK v2"),
            ("1.5", "Configure ESLint + strict TypeScript across all packages", "Shared config at repo root"),
            ("1.6", "Configure Vitest + React Testing Library in packages/web", ""),
            ("1.7", "Configure Playwright for end-to-end tests", "Separate packages/e2e or e2e/ directory"),
            ("1.8", "GitHub Actions CI: type check, lint, Vitest, build on every PR", "Retain results as evidence"),
            ("1.9", "GitHub Actions CD: deploy to Amplify + Lambda via OIDC on merge to main", "Scoped IAM roles, no long-lived keys"),
        ],
    },
    {
        "name": "Phase 2 — Data Model and Catalog",
        "summary": "Shared TypeScript types, Zod schemas, and a working JSON catalog for 3–5 destinations.",
        "tasks": [
            ("2.1", "Define TypeScript interfaces in packages/shared", "Based on docs/data-model.md: TripBrief, Constraint, Destination, CostLine, Source, Itinerary, Day, ChangeSnapshot"),
            ("2.2", "Define Zod schemas for all types", "One schema per interface; schemas are the runtime source of truth"),
            ("2.3", "Build JSON catalog: 3–5 destinations", "Each entry: cost ranges, source URLs, check dates, seasonal notes, uncertainty fields"),
            ("2.4", "Write catalog loader utility with stale-data detection", "Flag sources with dateChecked > 90 days as isStale: true"),
            ("2.5", "Unit tests: Zod schema parse/reject, stale-data detection", ""),
        ],
    },
    {
        "name": "Phase 3 — Trip Brief (View 1)",
        "summary": "Users can fill in a trip brief, see inputs classified as constraints or preferences, and be prompted to clarify an ambiguous budget.",
        "tasks": [
            ("3.1", "Build TripBriefForm component", "All required and optional fields from docs/ui-guidelines.md"),
            ("3.2", "Build constraint/preference classifier", "'no rental car' → hard constraint; 'hotel near restaurants' → preference"),
            ("3.3", "Build ConstraintChip (red) and PreferenceChip (blue) components", "Color + icon — never color alone"),
            ("3.4", "Budget clarification prompt", "'Does this include flights?' — Yes / No / Unsure; block proceed on Unsure until clarified"),
            ("3.5", "Zod validation on form submit", "Show inline field errors; disable submit until required fields pass"),
            ("3.6", "Unit tests: classifier, budget clarification logic", "Cover edge cases: ambiguous statements, missing required fields"),
            ("3.7", "Component tests: form validation, chip rendering", "React Testing Library"),
        ],
    },
    {
        "name": "Phase 4 — Destination Comparison (View 2)",
        "summary": "Users see up to three destination cards with cost breakdowns, trade-offs, and sources after submitting the trip brief.",
        "tasks": [
            ("4.1", "Lambda handler: destination proposals endpoint", "Receives TripBrief + Constraint[]; queries catalog; calls Bedrock"),
            ("4.2", "Bedrock integration", "AWS SDK for JavaScript; system prompt from docs/ai-prompt-guidelines.md"),
            ("4.3", "Output schema + Zod validation on Bedrock response", "Validate every response before returning to UI; structured error on parse failure"),
            ("4.4", "Constraint validation: block proposals that violate hard constraints", "No options depending on a car when no-rental-car is active"),
            ("4.5", "Budget fit check: flag proposals over budget", "budgetFitsConstraint and budgetDelta fields on each Destination"),
            ("4.6", "DestinationCard component", "Fit rationale, cost breakdown, trade-offs, weather, sources, uncertainties"),
            ("4.7", "EstimateBadge component", "Source name + date checked on hover/tap"),
            ("4.8", "SourceDisclosure collapsible component", "All sources with URLs and dates"),
            ("4.9", "Stale data warning icon", "Source isStale: true → warning icon with tooltip"),
            ("4.10", "Budget status indicator", "'Fits budget' or 'Exceeds by ~$X — adjustments needed'"),
            ("4.11", "No-match / infeasibility state", "Explain why; offer adjustments; never show an empty list"),
            ("4.12", "Unit tests: Lambda handler, constraint validation, budget fit check", "Use recorded Bedrock response fixtures — no live calls in CI"),
            ("4.13", "Component tests: DestinationCard, EstimateBadge, no-match state", ""),
            ("4.14", "Playwright: AC-1, AC-2, AC-3", "Budget clarification, no-rental-car, card completeness — see docs/testing-guidelines.md"),
        ],
    },
    {
        "name": "Phase 5 — Itinerary Workspace (View 3)",
        "summary": "Users get a day-by-day itinerary, can refine it conversationally, and see a change summary after every change.",
        "tasks": [
            ("5.1", "Lambda handler: itinerary generation endpoint", "Receives selected Destination + TripBrief + Constraint[]; calls Bedrock"),
            ("5.2", "Itinerary prompt + Zod output schema", "From docs/ai-prompt-guidelines.md; validate structure before returning"),
            ("5.3", "ItineraryTimeline component", "Day cards with morning/afternoon/evening sections; activities, meals, free periods, transit notes"),
            ("5.4", "UnverifiedLabel component", "Facts without a confirmed source are labeled — never presented as confirmed"),
            ("5.5", "BudgetSummary panel", "Category breakdown, total vs. ceiling, unknown costs shown as unknown (not zero)"),
            ("5.6", "Lambda handler: refinement endpoint", "Receives current itinerary snapshot + change request + constraints; returns revised plan"),
            ("5.7", "Change diffing logic", "Added / removed / modified activities; budget delta; include unchanged costs in summary"),
            ("5.8", "Full plan constraint recheck after every refinement", "Recheck the whole plan — not just the changed section"),
            ("5.9", "Conflict detection", "Requested change violates hard constraint → explain conflict, ask which requirement changes"),
            ("5.10", "ChangeSummaryBanner component", "Shows changed and unchanged cost lines after each refinement"),
            ("5.11", "RefinementPanel component", "Freeform text input + structured controls (lower budget, swap activity, change pace)"),
            ("5.12", "Error state: API failure preserves previous valid plan", "Show explicit error; never clear the previous plan"),
            ("5.13", "Unit tests: diff logic, budget recalculation, constraint recheck, conflict detection", ""),
            ("5.14", "Component tests: timeline, budget summary, change banner, error state", ""),
            ("5.15", "Playwright: AC-4 through AC-11", "Full acceptance criteria coverage — see docs/testing-guidelines.md"),
        ],
    },
    {
        "name": "Phase 6 — Navigation and Cross-Cutting",
        "summary": "The three views feel like a connected product; the app is accessible and responsive.",
        "tasks": [
            ("6.1", "Step indicator nav (Trip Brief → Destinations → Itinerary)", "Always visible; shows current step"),
            ("6.2", "Constraint strip above Itinerary Workspace", "Hard constraints and preferences persist visibly throughout the session"),
            ("6.3", "Responsive layout", "Mobile / tablet / desktop breakpoints from docs/ui-guidelines.md"),
            ("6.4", "Accessible markup", "Keyboard navigation, ARIA labels on badges, WCAG AA contrast ratios, date picker text fallback"),
            ("6.5", "Playwright: AC-11 — brief, budget, itinerary accessible outside conversation", ""),
        ],
    },
    {
        "name": "Phase 7 — Infrastructure (CDK)",
        "summary": "All AWS resources defined in CDK, deployed through CI, and monitored.",
        "tasks": [
            ("7.1", "CDK stack: Amplify Hosting", "React app, HTTPS, GitHub integration"),
            ("7.2", "CDK stack: Lambda + API Gateway", "Endpoints for proposals, itinerary, refinement"),
            ("7.3", "CDK stack: CloudWatch logging", "No full conversations or optional sensitive trip details logged by default"),
            ("7.4", "CDK stack: AWS Budgets alert", "Owner-approved threshold; alerts alone do not cap spend — add concurrency limits before pilot exposure"),
            ("7.5", "GitHub Actions OIDC + IAM roles", "Trust scoped to approved repository and branch; no long-lived keys"),
            ("7.6", "Confirm Bedrock model, region, and access with owner", "Owner approval required before any Bedrock call in production"),
        ],
    },
]

# ── JIRA helpers ──────────────────────────────────────────────────────────────

def get_issue_types():
    r = httpx.get(
        f"{JIRA_URL}/rest/api/3/project/{PROJECT}",
        headers=HEADERS, timeout=15
    )
    r.raise_for_status()
    types = {t["name"]: t["id"] for t in r.json().get("issueTypes", [])}
    return types

def create_issue(summary: str, description: str, issue_type_id: str, epic_key: str = None) -> str:
    body: dict = {
        "fields": {
            "project": {"key": PROJECT},
            "summary": summary,
            "description": {
                "type": "doc",
                "version": 1,
                "content": [{"type": "paragraph", "content": [{"type": "text", "text": description}]}],
            },
            "issuetype": {"id": issue_type_id},
        }
    }
    # Jira Cloud: use parent field to link a Story to an Epic
    if epic_key:
        body["fields"]["parent"] = {"key": epic_key}

    r = httpx.post(f"{JIRA_URL}/rest/api/3/issue", headers=HEADERS, json=body, timeout=15)
    if not r.is_success:
        print(f"    ERROR {r.status_code}: {r.text[:300]}")
        r.raise_for_status()
    return r.json()["key"]

# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    if not TOKEN:
        print("Error: ATLASSIAN_TOKEN env var is not set.")
        print("  export ATLASSIAN_TOKEN=<your-api-token>")
        sys.exit(1)

    if DRY_RUN:
        print("DRY RUN — no issues will be created.\n")
        for phase in PHASES:
            print(f"[Epic] {phase['name']}")
            for task_id, title, notes in phase["tasks"]:
                print(f"  [{task_id}] {title}")
                if notes:
                    print(f"         → {notes}")
        return

    print("Fetching issue types...")
    types = get_issue_types()
    print(f"Available types: {list(types.keys())}")

    epic_type_id = types.get("Epic")
    story_type_id = types.get("Story") or types.get("Task")

    if not epic_type_id:
        print("Warning: No 'Epic' issue type found. Creating all issues as Stories/Tasks.")
        epic_type_id = story_type_id

    created = []

    # Resume support: pass existing epic keys as EPIC_KEYS env var (comma-separated, in phase order)
    existing_epics = [k.strip() for k in os.environ.get("EPIC_KEYS", "").split(",") if k.strip()]

    for i, phase in enumerate(PHASES):
        if i < len(existing_epics):
            epic_key = existing_epics[i]
            print(f"\nUsing existing Epic {epic_key}: {phase['name']}")
        else:
            print(f"\nCreating Epic: {phase['name']}")
            if not DRY_RUN:
                epic_key = create_issue(
                    summary=phase["name"],
                    description=phase["summary"],
                    issue_type_id=epic_type_id,
                )
                print(f"  → {epic_key}")
            else:
                epic_key = "DRY-RUN"

        for task_id, title, notes in phase["tasks"]:
            description = f"[{task_id}] {notes}" if notes else f"[{task_id}]"
            print(f"  Creating: {title[:70]}...")
            task_key = create_issue(
                summary=f"[{task_id}] {title}",
                description=description,
                issue_type_id=story_type_id,
                epic_key=epic_key,
            )
            print(f"    → {task_key}")
            created.append((task_key, title))

    print(f"\nDone. Created {len(created)} tasks across {len(PHASES)} epics.")
    print(f"Board: {JIRA_URL}/jira/software/projects/{PROJECT}/boards/1")

if __name__ == "__main__":
    main()
