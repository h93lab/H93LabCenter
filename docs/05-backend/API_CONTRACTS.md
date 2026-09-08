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
