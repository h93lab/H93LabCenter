# Deployment

## Frontend — Vercel

- build Vite production bundle;
- configure SPA rewrite to `index.html`;
- set only browser-safe environment variables;
- use preview deployments for UI changes;
- production domain added to allowed auth redirect/CORS lists.

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
