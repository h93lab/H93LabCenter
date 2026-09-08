# Environments and Secrets

## Environments

Use at least:
- local development;
- production.

A separate staging Supabase project is recommended before production once scheduled research/spending is enabled.

## Local Development

Use Supabase local stack where practical for migrations/RLS/function testing. Mock or sandbox external providers to prevent accidental spending.

## Production

- Vercel production frontend;
- production Supabase project;
- production secrets in Supabase Edge Function secret store/Vault;
- public signup disabled;
- daily cron enabled only after a manual research run succeeds end-to-end.

## Secret Classes

### Browser-safe
- Supabase project URL;
- publishable/anon key as appropriate to current Supabase API guidance.

### Server-only
- Supabase service-role key;
- OpenRouter key;
- Reddit/Product Hunt/GitHub privileged tokens;
- paid intelligence provider keys;
- Figma client secret;
- webhook/signing secrets.

## Rotation

Document how to rotate each server secret without code changes. Source/AI adapters must surface `unauthorized` cleanly after credential revocation.

## Configuration

Non-secret settings belong in tables/versioned snapshots, not environment variables when the user is expected to change them through the UI.
