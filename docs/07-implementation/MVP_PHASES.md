# MVP Implementation Phases

## Phase 0 — Foundation

Goal: build the secure dashboard shell and backend foundation.

Deliver:
- fork/adapt shadcndashboard reference;
- Cairo font + light/dark;
- Supabase client/auth;
- owner-only login;
- migrations/RLS;
- application shell/routes;
- environment/secrets discipline;
- CI lint/type-check/test/build baseline.

Exit: authenticated owner sees shell; unauthorized access is blocked; migrations reproducible.

## Phase 1 — Research Operations & Evidence

Deliver:
- sources/settings/markets;
- research runs/jobs;
- queues + manual run;
- evidence ingestion contract;
- source adapter framework;
- source/run/job UI;
- initial free/public adapters;
- provenance and source health.

Exit: manual run collects/normalizes evidence durably with retries and visible status.

## Phase 2 — Signals & Opportunity Discovery

Deliver:
- claims/signals;
- signal taxonomy;
- embeddings/clustering;
- opportunity generation;
- dedupe/history;
- product concept generation;
- opportunities/trends pages.

Exit: run produces deduplicated opportunities/concepts tied to evidence.

## Phase 3 — Deep Intelligence

Deliver:
- competitor discovery/snapshots;
- review mining;
- market-gap analysis;
- local-market analysis;
- monetization/distribution;
- risk/kill assessment.

Exit: selected candidates have enough structured inputs for scoring.

## Phase 4 — Scoring & Decision UI

Deliver:
- scoring model engine;
- confidence model;
- recommendations;
- Idea of the Day logic;
- Dashboard;
- Idea Detail analysis-first UI;
- Executive Brief;
- score explanation/evidence drill-down.

Exit: owner can make GO/Watch/Pass decision from evidence-backed analysis.

## Phase 5 — AI Administration & Cost

Some capabilities exist earlier, but complete:
- role/model UI;
- prompt versions;
- usage/cost dashboard;
- budget enforcement;
- retry/fallback observability.

Exit: AI spend and configuration are controllable without code edits.

## Phase 6 — Blueprint Core

Deliver:
- GO -> Project;
- research freeze;
- Blueprint structured entities;
- staged generation;
- Markdown docs/editor;
- traceability graph;
- project workspace.

Exit: a GO project gets a coherent editable Blueprint draft.

## Phase 7 — Change Management & Versioning

Deliver:
- AI change chat;
- impact analysis;
- transactional apply;
- immutable versions;
- structured/document diffs;
- consistency validation.

Exit: multi-document changes remain coherent across versions.

## Phase 8 — Prototype + Figma

Deliver:
- prototype JSON;
- internal clickable preview;
- stale detection;
- FigmaAdapter;
- V1 plugin/handoff path for editable Figma nodes.

Exit: current Blueprint produces usable internal + editable Figma-oriented prototype artifact.

## Phase 9 — Quality, Export, Production Hardening

Deliver:
- quality gates;
- Ready for Development state;
- export ZIP;
- observability/runbooks;
- scheduled daily research;
- security/performance hardening;
- end-to-end acceptance tests.

Exit: production-ready personal platform and reproducible Blueprint export.
