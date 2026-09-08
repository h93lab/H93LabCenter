# Status and Lifecycles

## Research Run

`queued -> running -> completed | completed_with_warnings | budget_limited | failed | cancelled`

A completed-with-warnings run has useful results but at least one non-critical source/job failure.

## Research Job

`queued -> leased -> running -> succeeded | retry_wait | dead_letter | cancelled`

Jobs include `attempt_count`, `max_attempts`, `visibility_deadline`, and an idempotency key.

## Market Opportunity

`discovered -> researching -> active -> watch -> passed -> archived`

`active` means the opportunity is still relevant and may produce/scored concepts. Opportunity lifecycle is separate from a product concept recommendation.

## Product Concept Recommendation

Canonical recommendation values:

- `STRONG_BUILD`
- `BUILD`
- `VALIDATE_FIRST`
- `WATCH`
- `PASS`
- `KILLED`

The current recommendation is a derived/latest value; recommendation history remains immutable.

## User Disposition

User action is separate from system recommendation:

- `undecided`
- `shortlisted`
- `watching`
- `go`
- `passed`
- `archived`

This separation allows the user to GO despite `VALIDATE_FIRST` or watch a `BUILD` recommendation.

## Project

`blueprint_draft -> blueprint_review -> prototype_ready -> quality_blocked -> ready_for_development -> archived`

No development/production states are modeled in V1.

## Blueprint Version

- `draft`: mutable working state tied to an unpublished version number/revision.
- `validating`: locked while consistency/quality validation runs.
- `published`: immutable.
- `superseded`: published but not current.
- `failed_validation`: unpublished draft result requiring repair.

Never edit a `published` snapshot in place.

## Prototype Artifact

`not_generated -> generating -> current -> stale -> failed`

A prototype becomes `stale` whenever a later Blueprint version changes a traced screen, flow, component, or design decision.
