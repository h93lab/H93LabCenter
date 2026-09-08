# Observability

## Operational Surfaces

### Research Runs
Show run status, stage progress, source coverage, job counts, warnings, duration, budget, and resulting opportunities.

### Job Monitor
Show:
- queued/running/retry/dead-letter;
- job type;
- run/project context;
- attempt count;
- last error code;
- duration;
- next retry;
- safe payload summary.

### AI Usage
Show model/provider/role/cost/tokens/latency/schema-failure/retry statistics.

### Source Health
Track:
- last success;
- recent success rate;
- average latency;
- rate-limit/block/auth errors;
- parsing failure rate;
- freshness.

## Structured Logs

Log JSON-like fields:
- timestamp;
- level;
- event;
- request_id;
- run_id/job_id/project_id/change_request_id as relevant;
- duration_ms;
- safe error code;
- source/role/model when relevant.

Never log:
- API keys;
- Authorization headers;
- full provider credentials;
- unredacted secrets;
- unnecessary raw review/user personal information.

## Alerts / V1

At minimum surface in UI:
- daily run failed or missing;
- dead-letter jobs > 0;
- budget exhausted unexpectedly;
- AI schema failure spike;
- source auth failure;
- Blueprint validation blocked;
- prototype stale.

External notification integration is optional later; UI visibility is mandatory.
