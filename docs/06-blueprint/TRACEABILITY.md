# Blueprint Traceability

## Goal

Answer “Why does this requirement/feature/screen/task exist?” and “What breaks if we change it?”

## Trace Graph

Canonical relationships can include:

```text
Research Evidence
  -> Claim
  -> Product Decision
  -> Requirement
  -> Feature
  -> Screen / Flow / Rule
  -> Data / Integration
  -> Task
  -> Test
```

Not every node requires every intermediate hop, but critical product behavior should have an auditable path.

## Link Types

- `supports`
- `derived_from`
- `implements`
- `displayed_on`
- `governed_by`
- `depends_on`
- `validated_by`
- `affects`
- `supersedes`
- `contradicts`

## Orphan Rules

Mandatory quality failures include:
- MVP requirement with no implementation feature/task;
- user-visible feature with no requirement;
- navigable screen with no flow/feature purpose;
- critical business rule with no test;
- task that implements no tracked artifact;
- monetization screen not linked to monetization rules;
- research-derived differentiator absent from the product plan without an explicit decision rejecting it.

## Example

```text
EV-1042 / CLM-88
  -> DEC-014: Allow first value action before account creation
  -> REQ-021: User must be able to complete first-generation flow as guest
  -> FEAT-005: Guest first-use flow
  -> FLOW-002
  -> SCR-003
  -> RULE-008
  -> TASK-014
  -> TEST-021, TEST-022
```

This trace is used by change impact analysis.
