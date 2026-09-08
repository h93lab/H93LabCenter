# AI and Research Cost Control

## Budget Levels

Support:
- per AI call maximum;
- per role/day budget;
- per research run budget;
- daily total AI budget;
- monthly total AI budget;
- optional external paid-provider budget.

## Default V1 Research Behavior

Filter aggressively before expensive analysis:

```text
large evidence set
  -> cheap normalization/classification
  -> cluster/rank
  -> medium analysis on candidates
  -> expensive analysis only on top deep-research set
```

## Budget Enforcement

Budget checks occur server-side before invocation. Use database transactional counters/ledger, not browser estimates.

A budget-limited run:
- stops creating new expensive jobs;
- permits already-started work to finish if safe;
- records skipped jobs/reasons;
- can still complete with useful partial results;
- reduces confidence/coverage where appropriate.

## Cost Ledger

Each AI invocation stores:
- request ID;
- run/job/project/change request IDs;
- role;
- model/provider;
- input/output tokens;
- cached tokens if provided;
- cost USD;
- latency;
- result status.

Dashboard aggregates:
- today;
- month;
- per run;
- per role;
- per promoted opportunity;
- per deep analysis;
- per Blueprint generation;
- failed/retried cost.

## Anomaly Detection

Flag:
- role cost substantially above recent baseline;
- repeated schema failures/retries;
- runaway job fan-out;
- provider/model cost changes;
- unusually large prompt context.

## Paid Source Adapters

Paid adapters are disabled by default. Enabling requires explicit configuration and budget. A source adapter must report request units/cost when the provider supports it.
