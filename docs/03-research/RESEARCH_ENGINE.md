# Research Engine

## Purpose

The Research Engine continuously discovers and validates mobile-market opportunities. It is not a one-shot prompt. It is a durable, staged pipeline that separates collection, normalization, inference, scoring, and recommendation.

## Canonical Pipeline

```text
Research Run
  1. plan_run
  2. collect_sources
  3. normalize_evidence
  4. extract_claims
  5. extract_signals
  6. cluster_signals
  7. generate_market_opportunities
  8. dedupe_opportunities
  9. generate_product_concepts
 10. select_deep_research_candidates
 11. discover_competitors
 12. collect_competitor_snapshots
 13. mine_reviews_and_user_voice
 14. analyze_market_gap
 15. analyze_monetization_and_distribution
 16. assess_risks_and_kill_criteria
 17. compute_market_scores
 18. compute_research_confidence
 19. derive_recommendation
 20. promote_daily_idea_if_eligible
 21. finalize_run
```

Each numbered stage may produce one or more queue jobs. A stage must not assume that all sources succeeded.

## Run Planning

A run stores an immutable configuration snapshot:

- time window;
- enabled sources;
- enabled/priority markets;
- app/game allocation;
- categories included/excluded;
- source-specific rate/budget constraints;
- AI role versions;
- scoring model versions;
- max raw candidates;
- max deep-research candidates;
- total AI/external-data budget.

This makes historical runs reproducible even after settings change.

## Default Breadth Targets

Targets are configuration guidelines, not guarantees:

- collect/inspect 100–500+ raw signals when sources permit;
- produce 20–60 plausible market opportunities;
- promote 5–15 candidates into deep research;
- surface 3–5 top candidates;
- promote 0 or 1 Idea of the Day.

Do not spend expensive-model budget on all raw evidence.

## Source Failure Handling

Source adapters return a standardized status:

- `success`
- `success_partial`
- `rate_limited`
- `unauthorized`
- `blocked_by_terms_or_robots`
- `parse_failed`
- `network_failed`
- `disabled`

A run may complete with warnings if enough evidence remains. It must expose coverage loss and reduce confidence when critical sources are unavailable.

## Idempotency

Every job derives an idempotency key from stable inputs, e.g.:

```text
{run_id}:{job_type}:{source_id}:{market_id}:{subject_hash}:{pipeline_version}
```

Before expensive work, check if a successful output already exists for that key. Retried jobs must not duplicate evidence, signals, scores, or AI cost records.

## Manual Refresh

A user may request fresh deep research for one idea. This creates a scoped research run/research branch rather than mutating old evidence. The concept timeline receives new results and a new score/recommendation snapshot.

## Retention

- Keep normalized evidence and provenance needed for reproducibility.
- Keep raw provider payloads according to license/retention constraints.
- Archive high-volume operational job logs after an appropriate period.
- Never delete published Blueprint research snapshots when pruning research-operation logs.
