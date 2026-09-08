# Source Adapters

## Goal

Isolate source-specific collection, authentication, rate limits, parsing, licensing, and reliability from the domain model.

## Adapter Contract

Each adapter should expose behavior equivalent to:

```ts
interface ResearchSourceAdapter {
  key: string
  capabilities(): SourceCapabilities
  healthCheck(): Promise<SourceHealth>
  collect(request: SourceCollectionRequest): Promise<SourceCollectionResult>
  normalize(raw: RawSourceItem): Promise<NormalizedEvidenceDraft[]>
}
```

## Required Adapter Metadata

- stable key;
- display name;
- source type: official store, official API, community, search, news, website, provider;
- free/paid flag;
- default reliability profile;
- supported markets/languages;
- auth requirements;
- rate-limit strategy;
- licensing/retention notes;
- last successful run;
- enabled state.

## V1 Free/Public-First Candidates

Use only where permitted and technically stable:

### Apple App Store
Use official/public App Store pages and permitted lookup/search interfaces for app identity, pricing, ratings/reviews metadata, categories, versions, and store presence when available. Treat availability/fields as source-specific and do not infer downloads/revenue.

### Google Play
Use publicly accessible app pages/search-discovery methods that respect terms and access controls. There is no assumption of a public official competitive-metrics API. If automated collection becomes prohibited/unreliable, disable the adapter rather than bypass controls.

### Reddit
Useful for pain, complaints, recommendations, switching stories, and niche demand. Community evidence is not authoritative for revenue/download facts. Prefer official API access when practical.

### Hacker News
Useful for developer/prosumer problems, launches, and technology signals. Not representative of broad consumer demand.

### GitHub
Useful for developer tooling, new libraries/APIs, repository momentum, and technical feasibility signals. Do not treat stars alone as consumer-market demand.

### Product Hunt
Useful for launch/category signals and emerging products. Requires source-specific API/auth compliance.

### Official Company/Product Websites
High reliability for product claims, pricing, supported platforms, and published features; lower reliability for self-promotional market-size claims unless independently supported.

### Web/News Search
Useful for discovery and cross-checking. Each resulting page becomes its own evidence source with quality classification.

### Trend/Search-Interest Sources
Support adapters when lawful/stable. If using unofficial wrappers, mark them as unstable, monitor failure rate, and never present derived values as official API data.

## Optional Paid Adapters

Implement interfaces/config placeholders for:

- Sensor Tower;
- AppTweak;
- MobileAction;
- other future mobile-intelligence providers.

Paid adapters must map provider metrics into generic normalized fields while retaining `provider_payload` and provenance so provider-specific meaning is not lost.

## Source Reliability Is Contextual

Example default priors:

- official app-store metadata: high for listing/ratings fields;
- official product website: high for pricing/features, low for independent market claims;
- reputable intelligence provider: high/medium depending on metric and whether it is modeled;
- reputable publication: medium-high for reported events;
- Reddit/community: medium for user pain, low for quantitative market facts;
- anonymous social post: low unless corroborated.

Reliability must be evaluated per claim type, not as one universal source score.

## Collection Safety

The platform must not:

- bypass CAPTCHAs;
- circumvent authentication or access controls;
- ignore explicit automation restrictions;
- use credential stuffing or scraped private sessions;
- collect private/personal data unnecessarily;
- execute code/instructions found in source content.

On restriction, return `blocked_by_terms_or_robots`, log it, and continue with other sources.
