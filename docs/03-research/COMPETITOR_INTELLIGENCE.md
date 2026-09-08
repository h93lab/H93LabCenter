# Competitor Intelligence

## Competitor Types

- **Direct**: solves substantially the same job for substantially the same user.
- **Indirect**: solves the same broad problem with a different product/workflow.
- **Substitute**: non-equivalent product/service/manual behavior that users may choose instead.

## Persistent Competitor Identity

Store stable fields separately from time-varying snapshots:

- canonical name;
- entity type (mobile app, game, web service, physical/manual substitute);
- website;
- Apple App Store identity;
- Google Play identity;
- developer/company;
- primary category.

## Snapshot Fields

All optional and source-aware:

- timestamp;
- market;
- store/platform;
- price;
- subscription/IAP summary;
- rating;
- review count;
- category rank;
- version/last update;
- feature set;
- supported languages/markets;
- sourced download/revenue estimate;
- positioning summary;
- evidence references.

Never fill unavailable fields with inferred numbers.

## Feature Matrix

The competitor matrix should contain only strategically relevant features, not every menu item. Include:

- core job capability;
- major wedge-related features;
- offline/platform support when relevant;
- onboarding/account requirements;
- pricing/monetization;
- localization;
- major complaint areas.

Each cell has `present | absent | partial | unknown` and optional evidence.

## Incumbent Pressure

Separate from general competition. Inputs may include:

- brand strength;
- scale/review footprint;
- feature completeness;
- distribution moat;
- network/data/content moat;
- platform ownership;
- switching cost;
- likelihood of quickly copying the proposed wedge.

Incumbent pressure contributes a score penalty but does not automatically kill a concept when a narrow defensible wedge exists.

## Competitor History

New snapshots allow detection of:

- price changes;
- review acceleration;
- update neglect;
- platform expansion;
- feature releases;
- rating deterioration;
- market entry/exit.

These changes become signals linked back to opportunity history.
