# Deployment

## Deploy with Vercel

The [GitHub repository](https://github.com/h93lab/H93LabCenter) contains the frontend, backend source, migrations, tests, Figma plugin and documentation. Private local credentials, database contents and generated exports are excluded.

The README's [official Vercel Deploy Button](https://vercel.com/docs/deploy-button) creates a frontend deployment from this public repository. Prepare the Supabase backend below first; the button does not create a database, migrate data, provision an owner or deploy the worker.

1. Prepare a hosted Supabase project with the migrations, owner account and `center` Edge Function.
2. Click **Deploy with Vercel** in the README and choose the destination Git account/repository. To deploy this existing repository directly instead of cloning it, import `h93lab/H93LabCenter` from [Vercel New Project](https://vercel.com/new).
3. Keep the repository root as Root Directory. Use Node.js **24.x**. `vercel.json` selects Vite, `npm ci`, `npm run build`, the `dist` output and SPA route rewrites.
4. Enter these three values for the intended deployment environment:

| Variable | Production value |
|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | The project's browser-safe publishable key |
| `VITE_API_URL` | `https://<project-ref>.supabase.co/functions/v1/center` (no trailing slash) |

The button [requests variable names without embedding their values](https://vercel.com/docs/deploy-button/environment-variables). Never enter OpenRouter, Supabase secret/service-role or worker keys here. Vite embeds all `VITE_` values in the browser bundle. The local `/api` proxy exists only in the development server; it is not a production API endpoint.

5. Deploy, then set the backend's `APP_ORIGIN` to the exact HTTPS frontend origin and configure Supabase Auth Site URL/allowed redirect URLs for that domain. Set this before using the application. For a stable custom domain, use that domain consistently in both services.
6. Open `/login`, sign in as the provisioned owner, reload a nested route, then verify a manual research run and a private export download before enabling schedules.

Environment changes require a new frontend build. Preview deployments need an explicitly configured backend/auth origin; a preview URL alone does not authorize access to the production backend.

## Supabase

Deployment order:
1. database migrations;
2. seed/config rows as appropriate;
3. Edge Function secrets;
4. Edge Functions;
5. RLS verification;
6. Storage buckets/policies;
7. queue setup;
8. cron only after manual verification.

## Pre-Production Checklist

- public signup disabled;
- owner account works;
- RLS negative tests pass;
- OpenRouter budget configured;
- paid data adapters disabled unless intentionally enabled;
- source rate limits configured;
- manual research end-to-end succeeds;
- no dead-letter jobs;
- Vercel build passes;
- dark/light/mobile smoke tests pass;
- export bucket private;
- secrets absent from client bundle/logs.

## Rollback

- frontend: Vercel deployment rollback;
- Edge Functions: redeploy prior known-good version;
- database: prefer forward-fix migrations; do not rely on destructive rollback after data is written;
- scoring/prompt models: activate prior version without deleting historical rows.
