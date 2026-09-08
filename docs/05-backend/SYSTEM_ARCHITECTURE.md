# System Architecture

## High-Level Architecture

```text
Browser (React/Vite on Vercel)
  |
  | Supabase JS (authenticated owner session)
  v
Supabase
  |- Auth
  |- Postgres + RLS
  |- Storage
  |- pgvector
  |- Queues (pgmq)
  |- Cron (pg_cron)
  |- Vault
  |- Edge Functions
       |
       |- OpenRouter
       |- Research Source APIs / public endpoints
       |- Optional paid data providers
       |- Figma adapter endpoints / plugin handoff
```

## Architectural Boundaries

### Browser
Responsible for:
- authenticated UI;
- data queries/mutations permitted by RLS;
- document editing drafts;
- triggering server-side operations through authenticated Edge Functions;
- rendering internal prototypes;
- showing operational state.

Browser must not:
- hold service-role or third-party provider secrets;
- call paid research providers directly;
- call OpenRouter directly;
- calculate authoritative opportunity scores client-side;
- mutate published Blueprint versions.

### Postgres
System of record for:
- research entities;
- evidence/claims/signals;
- opportunities/concepts/competitors;
- scoring/recommendations;
- jobs/runs/cost ledger;
- Blueprint structured entities/documents/versions;
- settings and configuration snapshots.

### Edge Functions
Responsible for privileged boundaries:
- research-run creation/orchestration;
- queue consumer operations;
- source collection requiring secrets;
- OpenRouter calls;
- score/recommendation execution when requiring privileged context;
- Blueprint generation/change application;
- Figma OAuth/plugin exchange if implemented;
- export ZIP generation if done server-side.

### Queues
Use for durable retryable background work. Research pipeline and Blueprint generation should not be one long HTTP request.

### Cron
Use primarily to enqueue/schedule daily research and periodic maintenance, not to perform the whole research pipeline inline.

## Correlation IDs

All server workflows propagate:
- `request_id` for Edge Function request;
- `research_run_id` and `job_id` for research;
- `project_id`, `blueprint_version_id`, `change_request_id` for Blueprint workflows;
- `ai_invocation_id` for model calls.

Structured logs include applicable IDs.

## API Style

Use Supabase table/RPC access for simple owner-authorized CRUD. Use Edge Functions for business operations with orchestration, external network calls, privileged data, or multi-entity transactions.

Avoid creating a parallel general REST backend that merely proxies every Postgres query.
