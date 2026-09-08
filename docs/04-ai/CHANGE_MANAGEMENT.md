# Blueprint AI Change Management

## Principle

The AI chat is a controlled change-management system. A user request must never directly edit a published Blueprint document in isolation.

## Change Request Lifecycle

```text
created
 -> analyzing
 -> impact_ready
 -> approved
 -> applying
 -> validating
 -> published | failed_validation | cancelled
```

## Step 1 — Parse Intent

Convert user request into structured intent:
- requested outcome;
- explicit additions/removals/changes;
- constraints;
- ambiguous points;
- potential high-impact domains.

If ambiguity can be safely resolved from existing Blueprint decisions, do so. Otherwise surface the smallest necessary clarification before destructive/high-impact application.

## Step 2 — Impact Graph

Traverse traceability links to identify:
- requirements;
- features;
- business rules;
- screens/states;
- flows/navigation;
- data entities/integrations;
- analytics events;
- monetization/business docs;
- tasks/tests;
- prototype screens;
- agent/export docs.

Classify each impact: `add`, `update`, `remove`, `review`, `stale`.

## Step 3 — Preview

Show user:
- requested change summary;
- affected artifact count;
- high-risk consequences;
- exact major removals/additions;
- prototype impact;
- whether new research is recommended.

## Step 4 — Atomic Application

Create a new draft from the current published version. Apply structured entity changes first. Regenerate affected derived documents from canonical structured data where possible. Preserve stable IDs for surviving entities.

## Step 5 — Validate

Run:
- referential integrity;
- requirement-feature-screen coverage;
- navigation integrity;
- data/integration consistency;
- monetization/business-rule consistency;
- task/test traceability;
- prototype stale detection;
- security/privacy checks.

## Step 6 — Publish

Only publish when mandatory consistency checks pass. Store version diff, change request ID, actor, AI role/model/prompt versions, and validation report.

## Example

Request: `Change monetization from subscription to lifetime purchase.`

Likely impacts:
- monetization decision;
- pricing/paywall requirements;
- purchase/restore business rules;
- paywall screen copy/states;
- onboarding/upgrade flows;
- analytics events;
- RevenueCat/store integration guidance;
- ASO/positioning text;
- tasks/tests;
- prototype paywall screens.

The system must not change only `MONETIZATION.md`.
