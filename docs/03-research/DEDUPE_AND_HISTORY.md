# Deduplication and Opportunity History

## Goal

Prevent semantic duplicate ideas while preserving recurring evidence and changing market conditions.

## Dedupe Features

Compare candidates using:

- embedding similarity of normalized problem/JTBD;
- target audience similarity;
- category/app-game type;
- opportunity type;
- target markets;
- value proposition;
- wedge;
- canonical competitor set overlap;
- normalized key phrases.

Do not dedupe solely on title similarity.

## Two-Level Dedupe

### Market Opportunity
Two opportunities are duplicates when they describe substantially the same unmet job/problem, even if proposed solutions differ.

### Product Concept
Two concepts are duplicates when they propose substantially the same solution/wedge for the same user/problem.

## Decision Flow

1. deterministic exact keys/canonical IDs where possible;
2. vector similarity candidate retrieval using pgvector;
3. structured comparison;
4. constrained AI adjudication only for ambiguous high-similarity pairs;
5. persist merge/link decision and similarity evidence.

## Thresholds

Do not hardcode one threshold permanently. Store a dedupe-policy version with:
- vector candidate threshold;
- auto-merge threshold;
- manual/AI-review range;
- structured mismatch rules that prevent false merge.

## History

On re-detection:
- attach new signals/evidence;
- update `last_seen_at`;
- create timeline event;
- enqueue fresh scoring if evidence is material;
- preserve old score/recommendation snapshots;
- do not overwrite first-seen metadata.

## Timeline Event Types

- `discovered`
- `signal_added`
- `score_changed`
- `confidence_changed`
- `recommendation_changed`
- `competitor_change`
- `review_gap_change`
- `market_breakout`
- `user_disposition_changed`
- `go_created_project`

Each event includes before/after summary where appropriate and causal links to evidence/score records.
