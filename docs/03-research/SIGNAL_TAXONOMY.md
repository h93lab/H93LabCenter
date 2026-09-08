# Signal Taxonomy

Signals are normalized observations. Each signal has `type`, `direction`, `strength`, `market`, `category`, `observed_at`, `confidence`, and evidence links.

## Demand and Trend

- `SEARCH_GROWTH`
- `SEARCH_DECLINE`
- `SOCIAL_DISCUSSION_GROWTH`
- `SOCIAL_DISCUSSION_DECLINE`
- `REVIEW_VOLUME_GROWTH`
- `REVIEW_VOLUME_DECLINE`
- `RANKING_GROWTH`
- `RANKING_DECLINE`
- `DOWNLOAD_GROWTH_ESTIMATE`
- `DOWNLOAD_DECLINE_ESTIMATE`
- `REVENUE_GROWTH_ESTIMATE`
- `REVENUE_DECLINE_ESTIMATE`
- `CATEGORY_GROWTH`
- `CATEGORY_DECLINE`

Estimate signals must preserve provider/source and estimation status.

## User Voice

- `NEGATIVE_REVIEW_CLUSTER`
- `FEATURE_REQUEST_CLUSTER`
- `PRICING_OBJECTION_CLUSTER`
- `UX_FRICTION_CLUSTER`
- `RELIABILITY_COMPLAINT_CLUSTER`
- `LOCALIZATION_COMPLAINT_CLUSTER`
- `PRIVACY_CONCERN_CLUSTER`
- `SWITCHING_REASON_CLUSTER`
- `POSITIVE_DELIGHT_CLUSTER`

## Competition

- `NEW_COMPETITOR`
- `COMPETITOR_GROWTH`
- `COMPETITOR_DECLINE`
- `COMPETITOR_PRICE_CHANGE`
- `COMPETITOR_MONETIZATION_CHANGE`
- `COMPETITOR_FEATURE_LAUNCH`
- `COMPETITOR_PLATFORM_EXPANSION`
- `COMPETITOR_MARKET_EXPANSION`
- `COMPETITOR_NEGLECT` (e.g., stale updates + unresolved complaints)

## Technology / Platform

- `NEW_TECHNOLOGY`
- `NEW_API`
- `NEW_DEVICE_CAPABILITY`
- `OS_PLATFORM_CHANGE`
- `APP_STORE_POLICY_CHANGE`
- `THIRD_PARTY_API_CHANGE`
- `AI_MODEL_CAPABILITY_CHANGE`
- `AI_COST_CHANGE`

## Market Structure

- `LOCALIZATION_GAP`
- `PRICE_GAP`
- `BUSINESS_MODEL_GAP`
- `PLATFORM_GAP`
- `FEATURE_GAP`
- `WORKFLOW_GAP`
- `NICHE_GAP`
- `DISTRIBUTION_GAP`

## External Environment

- `REGULATORY_CHANGE`
- `CULTURAL_BEHAVIOR_CHANGE`
- `ECONOMIC_CHANGE`
- `SEASONAL_PATTERN`
- `NEWS_DRIVEN_SPIKE`

## Strength Normalization

When a quantitative source exists, adapters should normalize strength to 0–1 with the raw units preserved. When evidence is qualitative, AI may classify strength into a constrained enum (`weak`, `moderate`, `strong`, `extreme`) and the application maps it to a configurable numeric band for downstream ranking. Qualitative classification must not be displayed as a fabricated percentage.
