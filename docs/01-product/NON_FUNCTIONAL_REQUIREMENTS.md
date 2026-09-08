# Non-Functional Requirements

## Reliability

- Daily scheduling must be durable and observable.
- Queue jobs must be retry-safe and idempotent.
- A single source adapter failure must not corrupt the run.
- Published Blueprint versions and source evidence must remain immutable.
- Destructive actions must require explicit user confirmation in UI.

## Performance

- Main dashboard should become interactive quickly on a normal broadband connection; avoid blocking on fresh research.
- Lists use server-side pagination/filtering after realistic V1 volumes are exceeded.
- Large evidence bodies are lazy-loaded.
- Embedding/vector operations are asynchronous.
- Avoid loading every competitor/evidence record into one browser request.

## Scalability

Although V1 has one user, design for data growth from daily history:

- evidence can grow to hundreds of thousands of rows;
- job tables require archival/retention rules;
- competitor snapshots are time-series data;
- embeddings require vector indexes once dataset size warrants them;
- large raw payloads may move to Storage if database row size becomes excessive.

Do not implement multi-tenant SaaS abstractions merely for hypothetical scale.

## Security

- owner-only RLS;
- service-role only inside trusted server functions;
- strict secret handling;
- input validation at every Edge Function boundary;
- HTML/Markdown sanitization;
- external content treated as untrusted;
- no execution of fetched source instructions;
- no secret values in logs;
- CORS restricted to the deployed frontend where practical.

## Privacy

- Store only the data necessary for product research.
- Avoid collecting user-identifying review data unless required for source integrity.
- Respect provider retention/license requirements.
- Make source deletion/disable behavior explicit.

## Accessibility

- keyboard navigation for primary workflows;
- visible focus indicators;
- semantic headings/forms/tables;
- accessible names for icon-only controls;
- contrast that passes WCAG AA for normal product text;
- charts must have textual/table equivalents for critical values;
- do not encode recommendation solely by color.

## Maintainability

- strict TypeScript;
- central domain types generated/derived from database contracts where possible;
- schemas for AI output;
- provider adapters behind interfaces;
- no business scoring logic embedded in UI components;
- no monolithic Edge Function containing the entire daily pipeline;
- consistent structured logging and correlation IDs.

## Observability

Every run/job/AI call must be traceable through identifiers. Failures must include safe error codes and enough metadata to reproduce the stage without logging credentials/raw secret payloads.

## Cost

Research and AI work must respect configurable per-run/day/month budgets. The system must prefer filtering before expensive analysis.
