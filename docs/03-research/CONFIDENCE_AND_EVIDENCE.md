# Research Confidence and Evidence Model

## Research Confidence

Research Confidence measures how much trust to place in the analysis, not how attractive the opportunity is.

V1 confidence dimensions:

| Dimension | Weight | Meaning |
|---|---:|---|
| Source Quality | 25 | authority/reliability appropriate to claim type |
| Source Diversity | 15 | independent sources, not repetitions of one origin |
| Evidence Recency | 15 | freshness for time-sensitive claims |
| Cross-Source Agreement | 20 | corroboration vs contradiction |
| Coverage | 15 | enough evidence across demand/competition/user voice/market |
| Data Specificity | 10 | direct market/concept evidence vs broad analogies |
| Total | 100 | |

Final confidence is deterministic from stored subcomponents, though AI may classify claim relationships/coverage using constrained outputs.

## Verification Status

- `verified`
- `supported`
- `inferred`
- `estimated`
- `unknown`
- `contradicted`

A claim can have multiple supporting/contradicting evidence links.

## Claim-Evidence Relationship

Relationship types:

- `supports`
- `contradicts`
- `contextualizes`
- `estimates`

Each link stores strength and optional short rationale.

## Contradiction Handling

When credible evidence disagrees:

1. do not delete either side;
2. mark the claim conflict;
3. reduce agreement/confidence;
4. surface the conflict in Idea Detail when material;
5. optionally enqueue targeted research to resolve it.

## Provenance Fields

Evidence stores:
- source adapter;
- canonical URL/external ID;
- source title;
- source type;
- collected at;
- published/updated at when known;
- market;
- language;
- content hash;
- raw/normalized representation;
- license/retention metadata where needed;
- parser/normalizer version.

## Recency

Recency decay depends on claim type. Examples:

- current pricing/rank/review count: short half-life;
- product feature: medium half-life;
- historical launch date: no decay once verified;
- user pain: moderate decay;
- platform policy: current-version critical.

Do not use one universal freshness threshold for all evidence.
