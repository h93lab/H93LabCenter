# Blueprint Generation Pipeline

## Input Freeze

GO creates a project with a snapshot of:
- product concept;
- source market opportunity;
- current score/confidence/recommendation;
- market assessments;
- competitor analysis;
- review clusters;
- important evidence/decisions;
- owner development profile.

Blueprint generation uses this frozen input so later market changes do not silently rewrite the project.

## Stages

### Stage 1 — Product Architecture
Generate structured:
- product mission;
- personas/JTBD;
- scope/non-goals;
- requirements;
- features;
- business rules;
- decisions;
- monetization assumptions;
- success/validation metrics.

### Stage 2 — UX Architecture
Generate:
- information architecture;
- user flows;
- screen inventory;
- screen purpose and states;
- actions/navigation;
- accessibility requirements;
- component/design needs.

### Stage 3 — Technical Architecture
Generate Flutter-aware:
- architecture recommendation;
- state/navigation/storage/backend choices;
- data model;
- API/integration requirements;
- auth/security/privacy;
- analytics/crash handling;
- offline/background behavior where relevant;
- platform-specific concerns.

Do not generate the production codebase.

### Stage 4 — Business/Launch
Generate:
- monetization detail;
- pricing hypotheses;
- ASO positioning/keywords as hypotheses;
- launch validation plan;
- market localization requirements.

### Stage 5 — Execution Plan
Generate:
- implementation phases;
- tasks with dependencies;
- Definition of Done;
- test plan;
- release readiness checklist for downstream development.

### Stage 6 — Prototype
Generate structured prototype spec and internal preview.

### Stage 7 — Consistency Review
Find and repair/flag contradictions and missing coverage.

### Stage 8 — Documents
Render canonical Markdown documents from structured entities and curated narrative sections.

## Source of Truth Inside Blueprint

Structured entities are canonical for IDs/relationships. Markdown documents are canonical narrative exports but should be generated/updated from the same accepted structured version to avoid drift.

## Required Quality

A Blueprint is not considered complete simply because every Markdown filename exists. Validators must check content coverage and cross-references.
