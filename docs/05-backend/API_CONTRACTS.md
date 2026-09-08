# API and Operation Contracts

## Philosophy

Use direct Supabase queries for simple read models under RLS. Use Edge Functions/RPCs for domain operations.

## Key Domain Operations

### Start Research Run
`POST /functions/v1/research-run-start`

Request:
```json
{
  "mode": "manual",
  "scope": null,
  "idempotency_key": "uuid"
}
```

Response: research run ID/status.

### Refresh Idea
`POST /functions/v1/idea-refresh`

Request includes concept ID and optional market/source scope.

### GO
`POST /functions/v1/project-go`

Request:
```json
{
  "concept_id": "uuid",
  "source_score_snapshot_id": "uuid",
  "source_recommendation_id": "uuid",
  "idempotency_key": "uuid"
}
```

Server verifies all IDs belong to the current concept and are current/valid enough for GO.

### Analyze Blueprint Change
`POST /functions/v1/blueprint-change-analyze`

```json
{
  "project_id": "uuid",
  "base_blueprint_version_id": "uuid",
  "request_text": "Change monetization from subscription to lifetime purchase.",
  "idempotency_key": "uuid"
}
```

Returns Change Request ID and async status.

### Apply Blueprint Change
`POST /functions/v1/blueprint-change-apply`

Requires impact-ready approved change request and expected base version to prevent lost updates.

### Validate Blueprint
`POST /functions/v1/blueprint-validate`

Returns validation/quality job ID.

### Export Blueprint
`POST /functions/v1/blueprint-export`

Request selects published Blueprint version and adapter profile. Returns async export status and later private signed download reference.

## Read Models

Create query views/RPCs where direct joins would be complex or security-sensitive:

- `dashboard_summary`
- `idea_detail_read_model`
- `opportunity_score_explanation`
- `market_score_comparison`
- `research_run_summary`
- `blueprint_quality_summary`
- `ai_cost_summary`

Do not prematurely build a GraphQL/custom API layer.

## Concurrency

Mutation operations include expected current version/state where relevant. Use database constraints/transactions to reject stale mutations.

## Approved decision workspace extensions (2026-09-08)

All routes require the authenticated owner, use the same response envelope, and reject cross-owner references.

- `GET /decisions`: `q,market,category,kind,opportunity_type,recommendation,disposition,min_score,min_confidence,from,to,sort,page`. Filters and ordering execute before 30-row pagination. Recommendation, score and confidence are paired by snapshot IDs.
- `GET /decisions/compare?ids=<2–3 distinct concept UUIDs>`: sourced assessments, context and comparability warning.
- `GET /ideas/:id/decision`: market assessments, competitor snapshots/changes, source coverage, claim relationships, next validation step and recorded validations.
- `POST /ideas/:id/refresh`: `{market,query?,run_budget,request_key}`; reuses this concept and includes linked imported evidence. Published Blueprints remain frozen.
- `GET/POST /ideas/:id/validations`: POST accepts `{request_key,question,method,success_criterion,estimated_hours,estimated_cost_usd,outcome,result,evidence_ids,observed_at}`. Outcome is planned/supported/rejected/inconclusive; completed observations require a result and owned evidence. Replays preserve the first payload.
- `POST /evidence/import/preview` and `POST /ideas/:id/evidence/import`: `{format:csv|json,content,source_name,source_url,market,platform,language,sampled_at,confirmed_real_reviews:true,dataset_kind:real,request_key?}`. Preview does not write. Import requires request_key, validates up to 100 reviews and deduplicates immutable evidence. Required row fields: external_id,text,published_at,url,app_id; optional title,rating. Owner provenance is explicitly not independent verification.
- `PATCH /roles/:id`: additionally supports `daily_budget_usd:null|number` and `daily_call_limit:1..10000`. Zero per-call, role, run or workspace spend remains zero.
- Validate now includes export integrity; publish additionally requires successful private Storage creation. Missing files, broken archive links, duplicate paths or secrets in any document/JSON/manifest block publication.
