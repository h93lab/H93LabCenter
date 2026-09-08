# Domain Model

## Core Aggregate Relationships

```text
Owner
  -> Research Settings
  -> Research Runs
      -> Source Runs
          -> Raw Evidence
          -> Normalized Evidence
              -> Claims
                  -> Signals
                      -> Signal Clusters
                          -> Market Opportunities
                              -> Product Concepts / Ideas
                                  -> Competitors
                                  -> Review Clusters
                                  -> Market Scores
                                  -> Recommendations
                                  -> Timeline
                                  -> GO -> Projects
                                      -> Blueprint Versions
                                          -> Structured Blueprint Entities
                                          -> Documents
                                          -> Prototype Spec
                                          -> Quality Evaluation
                                          -> Export Package
```

## Entity Definitions

### Research Run
Represents one scheduled or manual discovery cycle. Tracks status, time window, markets, categories, source set, budgets, job counts, and resulting candidates.

### Evidence
Immutable representation of material collected from a source. Evidence is never overwritten when the source later changes; a new collection creates new evidence/snapshot data.

### Claim
A normalized statement extracted from evidence. Claims are the bridge between raw source content and higher-level analysis.

### Signal
A time-sensitive observation such as search growth, review growth, recurring complaints, new competitor launch, ranking movement, platform change, or localization gap.

### Signal Cluster
Groups semantically related signals into a broader pattern to avoid generating one opportunity per isolated observation.

### Market Opportunity
A market-level problem/gap/demand pattern. It is not yet the product solution.

### Product Concept
A proposed product response to an opportunity. Multiple concepts may belong to one opportunity.

### Idea
User-facing presentation of a deeply researched Product Concept. Implementation may use the same `product_concepts` entity instead of duplicating data into a separate `ideas` table.

### Competitor
A persistent market entity representing an app, game, service, or substitute. Time-sensitive metrics belong in competitor snapshots.

### Market Score
Country/global evaluation of an opportunity or concept under a versioned scoring model.

### Recommendation
A versioned decision record produced after score/confidence/kill evaluation.

### Project
Created only after the user presses GO. It owns Blueprint versions.

### Blueprint Version
An immutable snapshot of structured requirements, features, screens, flows, rules, decisions, tasks, docs, and prototype spec.

### Change Request
A user-authored request to change the Blueprint. It contains impact analysis before application and produces a new version after validation.

## Stable Identifiers

Generated Blueprint entities use human-readable stable keys in addition to UUIDs:

- `REQ-###` requirements;
- `FEAT-###` features;
- `SCR-###` screens;
- `FLOW-###` user flows;
- `RULE-###` business rules;
- `DEC-###` decisions;
- `EVT-###` analytics events;
- `TASK-###` implementation tasks;
- `TEST-###` test cases;
- `DATA-###` data entities/integration contracts when exported.

Stable keys do not change between Blueprint versions unless the entity is deleted and replaced by a materially different entity.
