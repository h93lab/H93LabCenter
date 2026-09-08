# Queues, Cron, and Job Orchestration

## Cron

Use Supabase Cron to trigger a **short timezone-aware dispatcher** (recommended every 15 minutes) rather than hardcoding one UTC daily time. The dispatcher converts `now()` into the owner's configured timezone, checks whether the configured local daily time has passed, and starts the run only when no daily scheduled research/promotion record exists for that local date. This avoids DST/timezone drift, including Africa/Cairo changes. The dispatcher should enqueue/start work and exit quickly.

Supabase recommends keeping cron jobs bounded and not running excessive concurrent jobs; the architecture therefore avoids using cron as a long-running research worker.

## Queues

Use Supabase Queues/pgmq for durable background messages. Application-level `research_jobs` remains the audit/state ledger.

## Queue Names

Recommended logical queues:

- `research`
- `blueprint`
- `maintenance`

Do not create one queue per job type unless operational evidence justifies it.

## Research Job Types

- `PLAN_RUN`
- `COLLECT_SOURCE`
- `NORMALIZE_EVIDENCE`
- `EXTRACT_CLAIMS`
- `EXTRACT_SIGNALS`
- `CLUSTER_SIGNALS`
- `GENERATE_OPPORTUNITIES`
- `DEDUPE_OPPORTUNITIES`
- `GENERATE_CONCEPTS`
- `SELECT_DEEP_CANDIDATES`
- `DISCOVER_COMPETITORS`
- `COLLECT_COMPETITOR_SNAPSHOT`
- `MINE_REVIEWS`
- `ANALYZE_MARKET`
- `ANALYZE_MONETIZATION_DISTRIBUTION`
- `ASSESS_RISKS`
- `COMPUTE_SCORE_CONFIDENCE`
- `DERIVE_RECOMMENDATION`
- `FINALIZE_RUN`

## Blueprint Job Types

- `FREEZE_GO_INPUT`
- `GENERATE_PRODUCT_BLUEPRINT`
- `GENERATE_UX_BLUEPRINT`
- `GENERATE_TECH_BLUEPRINT`
- `GENERATE_BUSINESS_BLUEPRINT`
- `GENERATE_TASK_PLAN`
- `GENERATE_PROTOTYPE_SPEC`
- `RENDER_DOCUMENTS`
- `CONSISTENCY_REVIEW`
- `QUALITY_GATES`
- `EXPORT_PACKAGE`

## Retry Policy

Classify errors:
- transient network/provider 5xx -> retry with exponential backoff;
- rate limit -> retry after provider delay;
- invalid AI schema -> bounded repair/fallback;
- authentication/config -> no blind retry, mark blocked;
- terms/robots restriction -> no retry until source configuration changes;
- deterministic validation bug -> dead-letter and surface.

## Idempotency

A successfully processed job with the same idempotency key returns existing result reference and must not charge AI/source cost again.

## Worker Concurrency

Start conservatively. Limit concurrency by:
- source/provider rate limits;
- OpenRouter budget;
- Supabase function/runtime constraints;
- database write contention.

## Maintenance Jobs

Examples:
- archive old operational logs;
- recompute source health;
- flag stale evidence/analysis;
- cleanup expired export files;
- monitor dead-letter jobs.
