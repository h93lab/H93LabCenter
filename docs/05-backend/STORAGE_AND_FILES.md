# Storage and Generated Files

## Supabase Storage Buckets

### `blueprint-exports` (private)
ZIP exports and optionally generated individual file artifacts. Owner access through signed URLs or authenticated download.

### `research-raw` (private, optional)
Only for raw evidence payloads too large/inappropriate for normal database rows and only when provider/license policy permits storage.

### `prototype-assets` (private)
Generated prototype images/assets that are not already externally hosted or represented structurally.

## Database vs Storage

Store canonical Markdown document content in Postgres per Blueprint version so it is queryable/versioned transactionally. Export ZIPs are derived files stored in Storage.

Large binary assets belong in Storage.

## Export Package Layout

Defined in `docs/06-blueprint/BUILD_PACKAGE_SPEC.md`. ZIP file name convention:

```text
<project-slug>-blueprint-v<version>-<yyyy-mm-dd>.zip
```

## Checksums

Export manifest stores SHA-256 for each file and whole archive where practical. This supports reproducible handoff and helps coding agents detect edits outside the canonical platform export.

## Signed URLs

Use short-lived signed URLs for exports. Do not make export buckets public for convenience.
