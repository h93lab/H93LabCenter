# Structured AI Output Contracts

JSON schemas under `/schemas` are application contracts. Edge Functions must validate AI responses against them before persistence.

## Required Schemas

- `signal.schema.json`
- `opportunity_candidate.schema.json`
- `competitor_analysis.schema.json`
- `review_clusters.schema.json`
- `final_judgment.schema.json`
- `blueprint_change_plan.schema.json`

## Schema Design Rules

- `additionalProperties: false` for critical objects where practical;
- enums for canonical taxonomy/status values;
- IDs are strings referencing known input IDs;
- unknown numeric facts must be nullable rather than fabricated;
- evidence IDs are explicit arrays;
- short rationale length should be bounded in application validation;
- schema includes its own `schema_version` when persisted independently.

## Validation Layers

1. JSON parse.
2. JSON Schema/Zod structural validation.
3. Semantic validation:
   - referenced IDs exist;
   - enum/status is allowed for context;
   - numeric ranges valid;
   - evidence-backed fields have evidence IDs;
   - no duplicate stable keys;
   - output size limits respected.
4. Persistence transaction.

## Repair

A repair retry receives only:
- original task contract;
- validation errors;
- invalid structured response if safe/size-limited;
- instruction to correct format without adding unsupported facts.

Maximum retries are role-configured.
