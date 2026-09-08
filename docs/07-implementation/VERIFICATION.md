# H93Lab Center verification record

## Environment

New application workspace: H93LabCenter. Independent local Supabase project: h93labcenter (API 55321). The old H93Lab code and local database remain separate. Browser frontend on 5178; shared-handler local API on 8788.

## Observed live behavior

- OpenRouter was called with the owner-provided server key; the key is not browser configuration.
- Public App Store, Hacker News and GitHub sources returned real evidence. GitHub rejected the first run and recovered on a later run. The first run displayed a source warning.
- Invalid provider schema/evidence references were rejected before opportunity persistence. Strict JSON schemas and enum-constrained evidence IDs fixed the contract failures.
- Habit-tracker analysis produced score 68 and a KILLED recommendation for lack of credible differentiation. GO was disabled.
- Pantry-inventory analysis produced a VALIDATE_FIRST concept. No automatic daily promotion was fabricated.
- A user-driven GO generated FamilySync Pantry Manager: 7 requirements, 6 screens, 9 implementation tasks, and 37 documents. Independent consistency review and deterministic gates passed.
- Internal prototype navigation and offline-state selection were exercised in the browser.
- Version 1 was published; a real AI change modified owner-only household member removal. The impact was shown before application. Version 2 passed independent review and was published; version 1 was superseded and preserved.
- ZIP export downloaded through both UI and authenticated API: 40 files, all file checksums verified. Prototype and Figma payload reference the same Blueprint version.
- Apple review feeds returned empty data for the sampled apps. No review clusters or counts were invented. Review ingestion and validation code exists, but live review coverage was unavailable in this sample.

## Automated checks

- Unit checks: deterministic app/game/confidence scoring; kill and threshold boundaries; invalid evidence references; safe export paths; cyclic task dependencies; stale prototype detection; mandatory independent review; stable IDs and timezone scheduling.
- Figma plugin contract check: creates editable frame/text nodes and navigation reactions; duplicate import is idempotent; unrelated pages and old versions are preserved; invalid targets rejected. This test uses the supported Plugin API surface in a harness, not an actual Figma account execution.
- Local integration suite: two-owner RLS, privileged write denial, budget rejection, normalized blueprint persistence, immutable published entities and manifests, concurrent-save conflict, atomic/repeated change application, draft-export blocking, private bucket.
- Real browser suite: login, data pages, document navigation, prototype screen/state selection, responsive navigation, light/dark persistence, no uncaught page exceptions.
- Acceptance suite: live published project, independent review, private storage download, ZIP manifest and SHA-256 checks, version-matched Figma payload.
- Final lint, TypeScript, 8 unit/contract checks, 8 integration checks, Vite build, browser suite and export acceptance passed. Local Supabase security/performance advisors report no warning/error issues; dependency audit found zero vulnerabilities.

## Final runtime and persistence checks

- Existing-owner email login works while public registration is rejected. The global signup flag is disabled; the email provider remains enabled.
- Cold service restart preserved both published Blueprint versions and generated documents. Interrupted test fixtures were cleaned up; the actual owner was preserved.
- A repeated pantry search completed with no job/source failures and reused the existing FamilySync opportunity and product concept via vector retrieval plus separate AI adjudication. It added a new score/confidence history (69.25 / 61) without changing either published Blueprint version.
- A separate full research run completed entirely in Supabase Edge Runtime v1.74.3, with the Node worker disabled: collection, extraction, discovery, two dedupe jobs and two analyses all succeeded. Measured run cost: $0.04.
- CLI `functions serve` reproducibly hung the OrbStack VM on this machine. Graceful OrbStack restarts recovered services without resetting databases. The same bundled application ran successfully in a resource-limited Edge container with code copied into its filesystem. `npm run edge:serve` packages this tested workaround; the standard CLI command is retained as `edge:serve:cli`.
- Edge ZIP export and signed download passed the same 40-file acceptance/checksum suite. A server-configured public Supabase URL makes local container-generated download links accessible from the browser.
- The Edge endpoint passed authenticated bootstrap and rejected unprivileged worker calls. Authorized background processing completed real research. Client bundle and Git candidate file scans found no server credentials.

## Pending external verification

Production Vercel and Supabase deployment requires account access for publishing and server-secret setup. CLI sessions were not authenticated at inspection. Figma receipt support does not establish that a user has imported a file until an actual plugin receipt is provided. Production Cron remains disabled until the hosted worker is verified. Local worker/dispatcher Cron is enabled after successful local Edge research.
