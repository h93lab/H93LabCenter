# Dashboard Specification

## Goal

The dashboard answers: **What changed, what is strongest, and what requires attention?** It is not a vanity analytics dashboard.

## Layout Order

### 1. Research Status Strip

Show:
- latest daily run status;
- completion time;
- duration;
- source success/failure count;
- AI/research cost;
- warning if partial, budget-limited, failed, or stale.

Primary actions:
- `View Run`
- `Run Research Now` (manual trigger; protected from duplicate concurrent run)

### 2. Today's Best Opportunity

If promoted:
- title;
- app/game;
- opportunity type;
- primary/best market;
- Opportunity Score;
- Research Confidence;
- Recommendation;
- trend direction;
- 2–3 sentence evidence-backed why-now summary;
- actions `Open Analysis`, `Executive Brief`, `Watch`, `GO` where valid.

If none:

```text
No High-Confidence Opportunity Today
No candidate met the configured promotion thresholds.
```

Then show best candidate, score, confidence, and exact blocking reason(s).

### 3. Attention Metrics

Recommended cards:
- New Opportunities
- Strong/Build Candidates
- Scores Increased
- Scores Dropped
- New Market Breakouts
- Research Warnings

Avoid lifetime totals unless operationally useful.

### 4. Top Movers

Rank opportunities by meaningful change over the last comparable period:
- score increase/decrease;
- confidence increase;
- trend acceleration;
- new competitor pressure;
- new review-gap evidence.

Each row must explain *why* it moved.

### 5. Emerging Categories

Rank app/game categories based on aggregated signals. Show sample size/confidence and avoid implying precise market growth when underlying source data is qualitative.

### 6. Market Breakouts

Countries/regions where local score materially exceeds global score or where momentum changed sharply.

### 7. Recent Projects

Only projects created after GO. Show Blueprint state, quality score, prototype state, and latest version.

## Dashboard Non-Goals

- no giant pie charts of arbitrary category distribution;
- no decorative geographic map unless it improves a concrete market comparison;
- no unsupported “revenue opportunity” totals;
- no mixing Research Confidence into Opportunity Score.
