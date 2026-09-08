# Review Mining and User Voice

## Purpose

Convert user feedback into structured evidence of pain, requests, friction, delight, pricing resistance, switching behavior, and localization gaps.

## Input Sources

Potential inputs:
- app-store reviews where legally/technically available;
- public community discussions;
- product feedback forums;
- public support/feature-request content;
- reputable review sites;
- user-uploaded research in future.

Respect source terms and minimize unnecessary copying of copyrighted text.

## Classification Taxonomy

Each feedback item may map to one or more:

- `BUG_RELIABILITY`
- `PERFORMANCE`
- `UX_FRICTION`
- `ONBOARDING_FRICTION`
- `FEATURE_REQUEST`
- `MISSING_INTEGRATION`
- `PRICING_OBJECTION`
- `ADS_OBJECTION`
- `PAYWALL_FRICTION`
- `LOCALIZATION`
- `ACCESSIBILITY`
- `PRIVACY_TRUST`
- `CUSTOMER_SUPPORT`
- `PLATFORM_GAP`
- `OFFLINE_GAP`
- `DELIGHT`
- `SWITCHING_REASON`
- `OTHER`

## Cluster Output

A review cluster contains:

- normalized theme;
- taxonomy type;
- sentiment;
- competitor(s);
- market/language;
- analyzed sample count;
- cluster item count;
- calculated share of analyzed sample when meaningful;
- confidence;
- representative short excerpts/summary;
- evidence IDs;
- first/last observed;
- trend vs prior sample if comparable.

## Statistical Honesty

Do not write `31% of users complain about price` when only a subset of reviews was sampled. Use:

> `31% of the 420 analyzed reviews in this sample mentioned pricing objections.`

Only compare cluster shares over time when sample methods are comparable.

## AI Pipeline

1. language detection/normalization;
2. spam/duplicate filtering where feasible;
3. constrained classification;
4. embedding + semantic clustering;
5. cluster naming/summarization;
6. confidence/coverage calculation;
7. human-visible sample inspection.

## Opportunity Use

Review clusters can contribute to:
- Problem Intensity;
- Market Gap;
- Wedge Strength;
- Incumbent/competition assessment;
- feature/UX decisions in Blueprint;
- kill criteria when complaints reveal structural safety/policy risk.

Every downstream use retains traceability to the cluster/evidence.
