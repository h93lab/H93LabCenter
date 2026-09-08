# Deterministic Scoring Model

## Principle

LLMs may classify factor inputs and explain evidence, but the final score is calculated by deterministic code using stored model versions and weights.

All factor values normalize to 0–100. Weighted score:

```text
Opportunity Score = sum(factor_value * factor_weight) / 100
```

Weights total 100.

## App Scoring Model V1 (`APP-1.0`)

| Factor | Weight | High score means |
|---|---:|---|
| Demand Strength | 15 | strong evidence people want/need the outcome |
| Trend Momentum | 10 | recent momentum supports timing |
| Problem Intensity | 10 | pain/frequency/urgency is meaningful |
| Market Gap | 15 | current options leave credible unmet needs |
| Monetization Attractiveness | 10 | plausible economics/willingness-to-pay/ad fit |
| Distribution Feasibility | 10 | reachable audience and credible acquisition paths |
| Solo Developer Fit | 8 | maintainable by one AI-assisted developer |
| Technical Feasibility | 5 | dependencies/APIs/platform behavior are practical |
| Localization/Market Leverage | 5 | local/cultural/language edge when relevant |
| Wedge Strength | 7 | clear, evidence-backed differentiated entry point |
| Competition Attractiveness | 5 | competitive structure is survivable after incumbent pressure |
| **Total** | **100** | |

## Game Scoring Model V1 (`GAME-1.0`)

| Factor | Weight |
|---|---:|
| Audience Demand | 12 |
| Trend Momentum | 12 |
| Core Gameplay Hook | 12 |
| Differentiation | 10 |
| Retention Potential | 12 |
| Monetization Potential | 10 |
| Production Feasibility | 10 |
| Content Burden (inverse) | 7 |
| Distribution / Virality | 10 |
| Platform Fit | 5 |
| **Total** | **100** |

## Factor Input Contract

Each factor stores:

- `raw_assessment` structured data;
- normalized 0–100 value;
- weight;
- weighted contribution;
- evidence claim IDs;
- factor-level confidence;
- missing evidence flags;
- calculation notes;
- scoring model/version.

## Recommendation Thresholds V1

These are defaults and configurable:

### Killed
Any active hard kill criterion.

### Strong Build
- score >= 85;
- research confidence >= 75;
- no hard kill;
- no unresolved critical feasibility/legality unknown.

### Build
- score >= 75;
- research confidence >= 65;
- no hard kill.

### Validate First
Any of:
- score >= 70 but confidence < 65;
- score >= 75 but one or more critical commercial assumptions lack evidence;
- promising market with unresolved acquisition/willingness-to-pay/technical dependency.

### Watch
- score 60–74 with improving momentum, or concept specifically benefits from waiting for more evidence/platform change.

### Pass
- score < 60, or material weakness makes it unattractive without meeting a formal hard-kill rule.

## Idea of the Day Promotion

Default eligibility:

- recommendation is `STRONG_BUILD` or `BUILD`;
- score >= 82;
- research confidence >= 70;
- no hard kill;
- no unresolved critical unknown;
- analysis freshness within configured window.

If zero candidates qualify, promote none.

## Country-Level Scoring

Use the same model with market-specific factor inputs where available. Global score uses global/aggregate evidence and does not simply average country scores.

## Score Versioning

Never recompute old historical rows in place after model weights change. Insert a new score snapshot with the new model version. UI comparisons should disclose if two points use different scoring versions.
