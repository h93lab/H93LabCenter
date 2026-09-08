# Operations Runbook

## Daily Run Missing

1. Check cron job history.
2. Check `research-run-start` function logs.
3. Verify owner/settings timezone/schedule.
4. Confirm queue infrastructure.
5. Trigger manual run only after determining no active duplicate.

## Run Stuck

1. Inspect queued/leased/running job counts.
2. Check visibility timeout/worker health.
3. Review last error by job type/source.
4. Retry only transient jobs; do not repeatedly retry auth/terms errors.
5. Mark/repair dead-letter jobs after cause fixed.

## AI Cost Spike

1. inspect cost by role/model;
2. inspect retry/schema-failure counts;
3. inspect prompt/context token size;
4. reduce candidate fan-out or temporarily disable expensive role;
5. never remove budget enforcement to “get the run through.”

## Source Blocked/Changed

1. mark source unhealthy/disabled if needed;
2. do not bypass access restrictions;
3. update parser/adapter version;
4. run fixture/live smoke test;
5. note reduced research coverage/confidence.

## Bad Duplicate Merge

1. do not rewrite old history invisibly;
2. record correction event;
3. separate entities with provenance restored;
4. update dedupe policy/version if systemic.

## Published Blueprint Has Defect

Published version remains immutable. Create new draft from it, fix through normal change/validation flow, publish next version, and mark prior version superseded.

## Figma Artifact Drift

If users manually changed Figma:
- do not import those changes as canonical automatically;
- show artifact status/reconciliation warning;
- allow controlled re-import/overwrite behavior only after feature is explicitly implemented.

## Local H93Lab Center commands

- Web: `npm run dev` (5178). Shared Node API/worker: `npm run dev:api` (8788).
- Supabase: `npm run db:start` (55321); owner credentials are in private `.local/owner.json`.
- Isolated Edge verification: `npm run edge:serve` (55325), then `npm run test:edge`.
- To drive the queue only from Edge, run the Node API with `LOCAL_WORKER_ENABLED=0`. Otherwise the Node worker processes jobs every 2.5 seconds.
- Edge verifies owner access itself, so the deployment uses `verify_jwt=false`; worker and dispatcher require the separate server secret.
- Do not restart a worker during active AI calls. A network interruption may leave a conservative cost reservation. Investigate the provider record before reconciling it.
- CLI serving can hang OrbStack with host-mounted function files on the tested machine. The isolated helper uses the same Supabase image with copied code and resource limits. Never reset Docker volumes to fix a runtime problem.
- Before rebuilding the helper container, let its active jobs complete, then stop/remove only `h93labcenter-edge-local`; run `edge:serve` again. The database containers and volumes are separate.
- For local Edge export URLs, the helper sets `PUBLIC_SUPABASE_URL` to localhost while keeping the internal connection URL on the Docker network.
