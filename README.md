# H93Lab Center

A new personal mobile-opportunity research workspace. React + Vite frontend; Supabase Auth, Postgres, Queues, Storage and Edge Functions backend. OpenRouter performs structured analysis and blueprint generation. The product stops at a validated, versioned Flutter development specification and interactive prototype.

## Local development

Requirements: Node 24, npm, Docker (Docker Desktop or OrbStack).

```sh
npm ci
npm run db:start
npm run db:setup
```

Put `OPENROUTER_API_KEY` and `APP_ORIGIN=http://127.0.0.1:5178` in `.env.server`. This file is server-only and ignored by Git. The setup script creates `.env.local` with publishable browser configuration and `.local/owner.json` with the local owner login. Do not commit either private file.

Run the API/worker and web app in separate terminals:

```sh
npm run dev:api
npm run dev
```

Open http://127.0.0.1:5178 and sign in with the local owner account. API runs on 8788. The isolated local Supabase API is 55321; it does not modify the old H93Lab app or its local database.

`db:setup` initializes development defaults. It is not a production provisioning command, and re-running it replaces local role/source/budget defaults. Applied migrations are append-only; do not reset a database containing research you want to keep.

## How to use

1. Configure sources, models and budgets in Settings / AI & models.
2. Run research for a query and market. Inspect source failures and job retries under Research runs.
3. Inspect opportunities, ideas, evidence, factor scores, confidence, competitors and kill assessments. No candidate is promoted unless its thresholds are met.
4. Choose GO on an eligible idea to freeze research and create a project.
5. Review product documents, structured entities, interactive screen states and quality findings. All mandatory checks and the independent consistency review must pass before publication.
6. Ask AI to change the product, inspect the proposed impact, and apply it as a new draft. Published versions are immutable.
7. Publish, download the ZIP, or export a Figma JSON payload. The companion plugin in `figma-plugin/` creates editable Auto Layout frames in a dedicated page per version.

## Verification

```sh
npm run check
npm run test:integration
npm run test:acceptance
npm run test:browser
npm run edge:build
```

Integration tests only accept the isolated localhost Supabase endpoint. They create and remove separate test owners. They verify RLS isolation, privileged mutation denial, budget rejection, immutable publications, concurrent version saves, atomic change application and private export storage.

## Architecture

- `src/`: domain-oriented React pages, auth shell and query cache.
- `supabase/functions/_shared/`: shared server contracts, AI gateway, source adapters, scoring, durable pipeline, API, dedupe and Figma handoff.
- `supabase/functions/center/`: production Edge Function entrypoint.
- `server/local.ts`: local HTTP adapter and worker for the same server code.
- `supabase/migrations/`: reused foundation tables plus append-only workflow guards.
- `figma-plugin/`: offline companion plugin; `npm run plugin:build` packages it.
- `docs/`: original source-of-truth specifications and implementation verification notes.

The API owns all expensive or privileged actions and verifies Supabase user tokens before owner-scoped queries. OpenRouter keys and service keys are never browser configuration. Worker calls require a separate secret. AI costs are reserved transactionally before network calls; uncertain charges remain conservatively reserved. Evidence is source-attributed; unknown market metrics are never replaced with demo values.

## Sources and limits

Initial public adapters: Apple App Store listings/review feeds, Hacker News and GitHub. Public sources can reject requests or return empty feeds; the UI exposes source status and missing review samples. Unconfigured adapters remain disabled. Ratings and listing counts are observations, not evidence of growth, downloads or revenue. Scores describe assessed opportunity quality; confidence describes the supporting evidence.

## Production deployment

See `docs/07-implementation/DEPLOYMENT.md` and `docs/07-implementation/RUNBOOK.md`. Vercel hosts only the frontend. Supabase hosts the privileged API and worker. Disable public signup; provision the owner through Supabase Auth administration. Configure exact CORS origin and server secrets before enabling Cron. Never expose a database service key as a Vite environment variable.

## Edge runtime verification

Run `npm run edge:build` before serving/deploying the function. This bundles pinned dependencies locally; the runtime does not need to download npm dependencies on a cold request. The configured entry point is `supabase/functions/center/main.generated.ts`, regenerated from the source entrypoint and ignored by Git. Run `npm run edge:serve` to start a resource-limited local Edge container on port 55325. It copies the built code into the container instead of mounting macOS files, and reads server secrets privately from `.env.server`. This avoids a reproducible OrbStack/CLI serve hang observed on this machine. For standard Docker environments, `edge:serve:cli` remains available with server-only secrets in `.local/edge.env`. Set `LOCAL_WORKER_ENABLED=0` when running the Node API if the Edge worker is driving the same queue.

See `docs/07-implementation/STATUS.md` for all 64 task states and `VERIFICATION.md` for observed checks and remaining external verification.

After a successful local Edge research run, `npm run cron:local` stores the local worker endpoint/key in Vault and schedules the worker every 15 seconds and the timezone dispatcher every 15 minutes. It preserves the owner's daily research preference. Hosted Cron is configured separately after production verification.
