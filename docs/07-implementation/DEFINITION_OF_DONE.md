# Definition of Done

A task is Done only when applicable items below are satisfied.

## Product
- behavior matches requirement IDs;
- no undocumented scope added;
- error/empty/partial states implemented;
- user-facing copy is English and clear.

## Data
- migration exists;
- constraints/indexes considered;
- RLS updated/tested;
- types/schema updated;
- historical/versioned behavior preserved.

## Backend
- inputs validated;
- auth/ownership checked;
- idempotency for retryable mutation;
- errors classified;
- logs/correlation IDs added;
- secrets not exposed;
- budget/cost impact considered.

## AI
- role and prompt version used;
- output schema validated;
- retries bounded;
- invocation telemetry stored;
- no unsupported facts accepted.

## Frontend
- follows reference dashboard style;
- Cairo font preserved;
- light/dark tested;
- responsive layout tested;
- keyboard/focus behavior checked;
- loading/empty/error states tested.

## Tests
- unit/integration/E2E added where required;
- existing tests pass;
- lint/type-check/build pass.

## Documentation
- affected spec/ADR/task updated if behavior changed;
- no contradiction introduced.
