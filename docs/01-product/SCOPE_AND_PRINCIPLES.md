# Scope and Product Principles

## In Scope

### Discovery
- scheduled daily global/local mobile opportunity research;
- manual research-run trigger;
- source adapters and source health;
- evidence normalization and provenance;
- signal extraction, clustering, and categorization;
- product concept generation from opportunities;
- semantic deduplication and timeline updates.

### Intelligence
- trend/demand analysis;
- direct, indirect, and substitute competitor discovery;
- competitor snapshots;
- review mining and complaint/request clustering;
- market-gap analysis;
- localization-arbitrage detection;
- monetization and distribution analysis;
- country-level scoring;
- risk and kill-gate analysis;
- opportunity score history and confidence history.

### Decision
- recommendations: Strong Build, Build, Validate First, Watch, Pass, Killed;
- Idea of the Day when quality thresholds are met;
- no forced daily idea;
- user actions: GO, Watch, Pass, Archive/restore where specified;
- explainable score breakdowns and evidence drill-down.

### Blueprint
- project creation after GO;
- generated product, UX, technical, business, research, test, and execution documents;
- structured feature/requirement/screen/rule/task entities;
- internal clickable prototype;
- Figma integration/handoff through a replaceable adapter;
- document editor;
- AI change-management chat;
- impact analysis;
- immutable Blueprint versions and diffs;
- consistency validation and quality score;
- exportable build package;
- final `Ready for Development` state.

### Administration
- owner authentication;
- research settings;
- markets/categories/source configuration;
- AI role/model/prompt configuration;
- cost and budget monitoring;
- job/run observability;
- integration settings.

## Out of Scope

- SaaS tenant billing and subscriptions;
- teams, invites, comments, shared editing, approvals;
- building the final Flutter application;
- repository creation and pull requests for generated apps;
- production deployment for generated apps;
- app-store submission and release management;
- post-launch product analytics;
- CRM/project-management features;
- arbitrary unrestricted web crawling;
- automated purchase of paid data without explicit configuration.

## Product Principles

1. **Evidence beats eloquence.** A plain supported statement is more valuable than persuasive unsupported AI prose.
2. **Unknown is a valid answer.** Missing data must remain unknown rather than being fabricated.
3. **A score is a comparison tool, not truth.** Show components, confidence, model version, and evidence.
4. **History matters.** A trend is a change over time, not one snapshot.
5. **Local markets are first-class.** Avoid treating the US/global average as universal.
6. **Solo-builder economics matter.** A large market can still be a poor personal build decision.
7. **No forced recommendations.** The system may report no strong opportunity.
8. **Reversible architecture first.** Source and AI adapters should be replaceable.
9. **Structured state beats prose-only state.** Core entities must be queryable and validated.
10. **The Blueprint owns product truth after GO.** Figma and exported Markdown are representations of that truth.
