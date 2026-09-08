# Database Schema Specification

SQL migrations in `/supabase/migrations` are the executable baseline. This document explains intent.

## Identity / Settings

### `profiles`
Owner profile keyed by `auth.users.id`.

### `app_settings`
Singleton-per-owner product settings: timezone, daily schedule, discovery allocation, budgets, daily promotion thresholds, current scoring models, development profile.

### `markets`
ISO-like market catalog with enabled/priority metadata.

### `categories`
Canonical app/game category taxonomy with optional provider/store mappings.

### `research_sources`
Source adapter registry, reliability metadata, free/paid state, config excluding secrets.

## Research Operations

### `research_runs`
One daily/manual/scoped run. Stores immutable config snapshot and aggregate status/cost.

### `research_jobs`
Durable application-level job ledger in addition to queue message state. Stores job type, payload/result refs, idempotency, attempts, state, timestamps, error code.

### `source_runs`
Per source/run/market execution state and coverage metadata.

## Evidence / Intelligence

### `evidence`
Immutable source item representation with provenance and content hash.

### `claims`
Atomic claims extracted from evidence.

### `claim_evidence`
Many-to-many support/contradiction/context/estimate links.

### `signals`
Canonical signal records.

### `signal_evidence`
Signal-to-evidence/claim support links.

### `signal_clusters`
Semantic cluster with optional embedding.

### `signal_cluster_members`
Cluster-to-signal join.

## Opportunities / Concepts

### `opportunities`
Market-level opportunity/problem entity.

### `opportunity_markets`
Market-specific opportunity metadata, not final concept score.

### `opportunity_signals`
Opportunity-to-signal trace.

### `product_concepts`
Product solution concepts. User-facing “Ideas” can read from this table.

### `concept_markets`
Concept/market target metadata.

### `opportunity_timeline_events`
Historical events for opportunities/concepts.

## Competitors / Voice of Customer

### `competitors`
Persistent competitor identity.

### `competitor_snapshots`
Time/market/store-specific data.

### `concept_competitors`
Direct/indirect/substitute relation and incumbent pressure.

### `review_items`
Normalized bounded review/user-voice inputs when retention permits.

### `review_clusters`
Clustered user-voice themes with sample metadata.

### `review_cluster_members`
Optional review membership for auditability.

## Scoring / Recommendation

### `scoring_models`
Versioned factor weights/config.

### `score_snapshots`
Immutable concept/market score record with factor JSON and model ID.

### `confidence_snapshots`
Immutable research-confidence components.

### `kill_assessments`
Rule evaluation results.

### `recommendations`
Immutable recommendation snapshots.

## AI

### `ai_roles`
Current role configuration.

### `prompt_versions`
Immutable prompt templates.

### `ai_invocations`
Token/cost/latency/model/provider/schema/result metadata.

## Projects / Blueprint

### `projects`
Created after GO and linked to source concept + frozen research snapshot.

### `blueprint_versions`
Draft/published version records.

### `blueprint_documents`
Markdown documents by path/type for one version.

### Structured Blueprint Tables
Use one table per major entity family or a carefully constrained generic entity table. Baseline migrations use normalized tables for:
- requirements;
- features;
- business rules;
- screens;
- user flows;
- decisions;
- tasks;
- tests/acceptance checks;
- traceability links.

### `prototype_artifacts`
Internal/Figma artifact metadata and source Blueprint version.

### `change_requests`
User change request + parsed intent + status.

### `change_impacts`
Affected artifact list and actions.

### `quality_reports`
Blueprint quality gate results.

### `export_packages`
Generated export manifest/storage reference/checksum.

## JSONB Policy

Use JSONB for:
- provider-specific raw payloads;
- immutable run config snapshots;
- scoring factor component detail;
- AI role/model preferences;
- prototype machine spec;
- validation reports;
- export manifest.

Do not bury searchable canonical relationships such as competitor type, market, stable requirement ID, or project version only inside JSON.
