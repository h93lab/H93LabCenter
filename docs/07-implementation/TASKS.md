# Implementation Tasks

Implement in dependency order. Status should be tracked in the implementation repository, but do not delete acceptance criteria from this file.

## Phase 0 — Foundation

### TASK-001 — Bootstrap UI from Reference
Dependencies: none.

- start from or faithfully adapt `shadcndashboard/shadcndashboard` React/Vite structure;
- preserve MIT/attribution requirements;
- remove irrelevant demo apps/pages without destroying reusable primitives;
- configure Cairo;
- preserve dark/light;
- establish feature-oriented source layout.

Definition of Done:
- desktop/mobile shell visually matches reference language;
- theme persists;
- `npm run build` and lint succeed;
- no demo business data remains in primary navigation.

### TASK-002 — Supabase Project Foundation
Dependencies: TASK-001.

- install/configure Supabase client;
- local dev setup;
- apply migrations;
- typed client strategy;
- environment validation.

DoD: clean local database can be created from migrations/seed.

### TASK-003 — Owner Authentication + RLS
Dependencies: TASK-002.

Implement login, route protection, production no-signup behavior, owner policies, security tests.

### TASK-004 — Core Layout/Router
Dependencies: TASK-001, TASK-003.

Implement route map from `docs/02-ui/ROUTES_AND_PAGES.md` with placeholder feature views and standard loading/not-found/error boundaries.

## Phase 1 — Research Operations

### TASK-010 — Settings/Markets/Sources Data Layer
Dependencies: TASK-002, TASK-003.

Implement tables, typed queries, settings pages, source registry, market priorities.

### TASK-011 — Research Run + Job Ledger
Dependencies: TASK-010.

Implement run/job creation/state machine/idempotency/operations UI.

### TASK-012 — Supabase Queues + Worker Skeleton
Dependencies: TASK-011.

Create queues, worker dispatch, retry/error classes, correlation logging.

### TASK-013 — Manual Research Start
Dependencies: TASK-012.

Authenticated start operation with config snapshot/budget/concurrency guard.

### TASK-014 — Evidence Persistence + Normalization Contract
Dependencies: TASK-012.

Implement immutable evidence, hashes, normalization versioning, provenance UI.

### TASK-015 — Initial Source Adapters
Dependencies: TASK-014.

Implement adapter interface plus a small legal/stable set of useful sources. Do not block Phase 1 on every desired source.

### TASK-016 — Source Health + Run Detail UI
Dependencies: TASK-015.

## Phase 2 — Discovery

### TASK-020 — AI Role/Prompt/Invocation Core
Dependencies: TASK-012.

OpenRouter service, role config, prompt versions, structured output validation, invocation ledger.

### TASK-021 — Claim Extraction
Dependencies: TASK-014, TASK-020.

### TASK-022 — Signal Extraction
Dependencies: TASK-021.

Use canonical taxonomy and evidence links.

### TASK-023 — Embeddings + Signal Clustering
Dependencies: TASK-022.

Enable pgvector, embeddings abstraction, semantic cluster candidate logic.

### TASK-024 — Market Opportunity Generation
Dependencies: TASK-023.

### TASK-025 — Opportunity Deduplication/History
Dependencies: TASK-024.

Implement exact/vector/structured/AI ambiguous adjudication path.

### TASK-026 — Product Concept Generation
Dependencies: TASK-025.

### TASK-027 — Opportunities/Trends UI
Dependencies: TASK-024–026.

## Phase 3 — Deep Intelligence

### TASK-030 — Competitor Identity + Discovery
Dependencies: TASK-026.

### TASK-031 — Competitor Snapshots + Matrix
Dependencies: TASK-030.

### TASK-032 — Review/User Voice Ingestion
Dependencies: TASK-030, TASK-015.

### TASK-033 — Review Classification/Clustering
Dependencies: TASK-032, TASK-020.

### TASK-034 — Market Gap Analysis
Dependencies: TASK-031, TASK-033.

### TASK-035 — Market/Localization Analysis
Dependencies: TASK-034.

### TASK-036 — Monetization + Distribution Analysis
Dependencies: TASK-031, TASK-034.

### TASK-037 — Risk + Kill Assessment
Dependencies: TASK-034–036.

## Phase 4 — Scoring & Decision

### TASK-040 — Deterministic App Score Engine
Dependencies: TASK-034–037.

Implement APP-1.0 factors/weights/versioned snapshots with unit tests for exact math.

### TASK-041 — Deterministic Game Score Engine
Dependencies: TASK-040.

Implement GAME-1.0 separately.

### TASK-042 — Research Confidence Engine
Dependencies: TASK-034–037.

### TASK-043 — Recommendation Engine
Dependencies: TASK-037, TASK-040–042.

Threshold/kill/critical-unknown logic; no LLM score mutation.

### TASK-044 — Daily Promotion Logic
Dependencies: TASK-043.

Allow zero promoted ideas.

### TASK-045 — Idea Detail Read Model + UI
Dependencies: TASK-043.

Implement all analytical sections, market scores, explanations, evidence drill-down, history.

### TASK-046 — Executive Brief
Dependencies: TASK-045, TASK-020.

### TASK-047 — Dashboard
Dependencies: TASK-044–046.

## Phase 5 — AI Administration & Cost

### TASK-050 — AI Role Settings UI
Dependencies: TASK-020.

### TASK-051 — Prompt Version UI
Dependencies: TASK-020.

### TASK-052 — AI Usage/Cost Dashboard
Dependencies: TASK-020.

### TASK-053 — Budget Enforcement + Anomaly Warnings
Dependencies: TASK-052.

## Phase 6 — Blueprint

### TASK-060 — GO -> Project + Frozen Research Snapshot
Dependencies: TASK-045.

### TASK-061 — Blueprint Version/Entity Schema
Dependencies: TASK-060.

### TASK-062 — Product Blueprint Generator
Dependencies: TASK-061, TASK-020.

### TASK-063 — UX Blueprint Generator
Dependencies: TASK-062.

### TASK-064 — Technical/Business Blueprint Generators
Dependencies: TASK-062.

### TASK-065 — Task/Test Planner
Dependencies: TASK-063–064.

### TASK-066 — Traceability Graph
Dependencies: TASK-062–065.

### TASK-067 — Markdown Renderer + Document Workspace
Dependencies: TASK-066.

## Phase 7 — Change + Versioning

### TASK-070 — Change Request/Impact Analysis
Dependencies: TASK-067.

### TASK-071 — Transactional Draft Apply
Dependencies: TASK-070.

### TASK-072 — Consistency Validator
Dependencies: TASK-071.

### TASK-073 — Publish Immutable Version
Dependencies: TASK-072.

### TASK-074 — Version Diff UI
Dependencies: TASK-073.

## Phase 8 — Prototype/Figma

### TASK-080 — Prototype Schema + Generator
Dependencies: TASK-063, TASK-073.

### TASK-081 — Internal Clickable Prototype
Dependencies: TASK-080.

### TASK-082 — Prototype Stale Detection
Dependencies: TASK-080, TASK-074.

### TASK-083 — FigmaAdapter Contract
Dependencies: TASK-080.

### TASK-084 — Figma Plugin/Handoff MVP
Dependencies: TASK-083.

Create editable frames/nodes through supported Figma Plugin API path; stable IDs; safe scoped payload exchange.

## Phase 9 — Quality/Export/Production

### TASK-090 — Deterministic Quality Gates
Dependencies: TASK-073, TASK-081.

### TASK-091 — AI Consistency Review Integration
Dependencies: TASK-090.

### TASK-092 — Ready for Development State
Dependencies: TASK-090–091.

### TASK-093 — Export Package/Manifest/ZIP
Dependencies: TASK-092.

### TASK-094 — Daily Cron
Dependencies: TASK-047, TASK-053.

Enable only after manual end-to-end research is reliable.

### TASK-095 — End-to-End Acceptance Suite
Dependencies: all above.

### TASK-096 — Production Security/Performance Review
Dependencies: TASK-095.
