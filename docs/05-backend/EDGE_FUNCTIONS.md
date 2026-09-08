# Edge Functions

## Function Design Rule

Edge Functions are small privileged/orchestration boundaries. Long pipelines must enqueue durable jobs rather than hold one HTTP request open.

## Proposed Functions

### `research-run-start`
Auth: owner or trusted cron invocation.
Responsibilities:
- validate no conflicting run if policy disallows overlap;
- snapshot settings;
- create research run;
- enqueue initial planning/source jobs;
- return run ID.

### `research-job-worker`
Auth: trusted/server invocation.
Responsibilities:
- lease/read queue messages;
- dispatch by job type;
- update job ledger;
- call source/AI adapters;
- enqueue dependent jobs;
- enforce retries/budgets/idempotency.

May later split into multiple workers if isolation/timeout requirements justify it.

### `idea-refresh`
Owner-authenticated scoped refresh for one concept/opportunity.

### `score-recompute`
Owner or internal trusted call. Calculates deterministic score/confidence/recommendation from stored inputs under specified scoring model.

### `project-go`
Owner-authenticated. Freezes research snapshot and creates Project/initial Blueprint generation jobs.

### `blueprint-job-worker`
Processes staged Blueprint generation jobs.

### `blueprint-change-analyze`
Creates a Change Request and returns async analysis/job ID.

### `blueprint-change-apply`
Owner-authenticated; requires impact-ready/approved request. Creates draft, applies structured changes transactionally, then queues validation.

### `blueprint-validate`
Runs deterministic and AI consistency checks and writes quality report.

### `blueprint-export`
Creates export manifest/files/ZIP and stores in private Storage with signed download path returned to owner.

### `figma-auth-callback` / `figma-payload`
Only if using an OAuth/plugin exchange. Keep behind adapter-specific implementation.

## Request Validation

Every public/authenticated function validates:
- JWT/session;
- JSON body schema;
- ID ownership;
- allowed current state;
- idempotency key for mutation operations;
- budget/rate controls for expensive operations.

## Responses

Use consistent envelope:

```json
{
  "ok": true,
  "data": {},
  "request_id": "uuid"
}
```

Errors:

```json
{
  "ok": false,
  "error": {
    "code": "BLUEPRINT_VERSION_IMMUTABLE",
    "message": "Published Blueprint versions cannot be edited."
  },
  "request_id": "uuid"
}
```

Do not expose internal stack traces or provider secrets.
