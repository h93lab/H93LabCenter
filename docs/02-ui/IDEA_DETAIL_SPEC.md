# Idea Detail Page Specification

## Objective

Provide the complete evidence-backed decision surface for one deeply researched product concept. The page opens in analytical mode. Executive Brief is optional.

## Sticky Header

Show:
- Idea title;
- category;
- App/Game;
- opportunity type;
- target market badges;
- analysis date / freshness;
- current system recommendation.

Actions:
- `Executive Brief`
- `Shortlist` or `Watch`
- `Pass`
- `GO`
- overflow: archive, refresh deep research, export report.

GO must display a confirmation summarizing the research/score snapshot that will be frozen into the new Project.

## Analytical Hero Grid

Show distinct metrics:

- Opportunity Score (0–100)
- Research Confidence (0–100)
- Trend Strength
- Demand
- Market Gap
- Monetization
- Distribution Feasibility
- Solo Developer Fit
- Technical Feasibility
- Wedge Strength
- Competition/Incumbent Pressure

Do not place every factor in identical large cards. Use 2–4 primary cards and a compact factor panel to preserve hierarchy.

## Market Scores

Show Global plus highest-priority local markets. Table fields:

- Market
- Score
- Confidence
- Demand
- Competition
- Monetization
- Localization leverage
- Trend
- Key reason

Allow sorting and expanding a market explanation.

## Section Order

1. Overview
2. Why Now
3. Evidence & Signals
4. Market Analysis
5. Competitor Landscape
6. User Voice / Review Mining
7. Market Gaps
8. Proposed Product
9. Wedge & Differentiation
10. Target Users / JTBD
11. MVP / Feature Thesis
12. Monetization
13. Distribution
14. Technical & Solo-Builder Feasibility
15. Risks
16. Kill Criteria
17. Score Breakdown
18. Evidence Sources
19. History

## Score Explainability Sheet

Clicking any score opens:
- factor name;
- current normalized factor value;
- configured weight;
- weighted contribution;
- scoring model/version;
- supporting claim IDs;
- research confidence relevant to the factor;
- missing/contradictory evidence;
- calculation timestamp.

## Competitor Landscape

Separate groups:
- Direct
- Indirect
- Substitutes

For each competitor show only sourced/known fields. Include latest snapshot date. Provide a matrix for strategically relevant features, pricing, platform/market support, and known weaknesses.

## Review Mining

Display cluster cards or ranked table:
- cluster category;
- normalized theme;
- count in analyzed sample;
- sample denominator;
- percentage of analyzed sample if statistically meaningful;
- confidence;
- competitors affected;
- short evidence excerpts/links.

## Kill Criteria Panel

Always visible even when no kill fires. Show:

- `No hard kill triggered` plus evaluated checks; or
- `KILLED` with exact rule(s), evidence, severity, and whether override is allowed. V1 should not silently override hard kills.

## Executive Brief

Open as side sheet or dialog. Required fields:

- Verdict
- Why now
- Strongest evidence
- Biggest risk
- Best market
- Winning wedge
- Recommended monetization
- Recommended MVP
- What to validate first

Executive Brief is derived from existing analysis and must not introduce new unsourced facts.

## History

Timeline entries include:
- first discovery;
- score/confidence changes;
- new signal clusters;
- competitor changes;
- recommendation changes;
- user disposition changes;
- major evidence additions.
