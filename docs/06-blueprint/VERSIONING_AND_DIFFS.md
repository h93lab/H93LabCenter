# Blueprint Versioning and Diffs

## Published Version Model

Published Blueprint versions are immutable. Use monotonically increasing integer display versions (`v1`, `v2`, ...) plus UUID primary keys.

## Draft Model

A draft has:
- base published version ID;
- draft revision number;
- creator (owner/AI workflow);
- source change request(s);
- lock/status;
- validation state.

Only one active mutable draft per project is recommended in V1 to avoid merge complexity.

## Publish Transaction

1. freeze draft mutation;
2. run deterministic integrity validators;
3. run required consistency AI review;
4. calculate quality report;
5. if mandatory checks pass, write immutable version snapshot;
6. mark prior current version `superseded`;
7. set new version `published/current`;
8. calculate/store diff;
9. mark derived prototype artifacts stale/current as appropriate.

## Diff Types

### Structured
- entity added;
- entity removed;
- field changed;
- relationship changed;
- stable ID renamed only via explicit migration.

### Documents
Line/semantic Markdown diff for human review.

### Quality
Before/after quality score and gate changes.

### Prototype
Affected screen/flow/component IDs.

## Version Metadata

Store:
- version number;
- created/published at;
- actor;
- base version;
- change request IDs;
- generation roles/prompt versions where applicable;
- quality report ID;
- manifest checksum.
