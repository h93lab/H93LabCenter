# Authentication and RLS

## Authentication Model

V1 has one owner account. Use Supabase Auth for login/session management. Production must not expose public signup.

Supported login can be email/password and/or magic link depending on owner preference. The implementation must not add social auth without a requirement change.

## Ownership Model

Owner-facing root tables contain `owner_id uuid references auth.users(id)` where practical. Child records inherit security through parent joins/policies or also carry owner ID for simpler policies/high-volume filtering.

Default owner policy intent:

```sql
owner_id = auth.uid()
```

## Service-Side Automation

Queue consumers and scheduled functions may use service-role access server-side. This does not justify disabling RLS for browser access.

## Public Access

No research, idea, Blueprint, source, AI usage, or settings data is public in V1.

## RLS Rules

- `profiles`: owner can select/update self.
- settings/sources/markets preferences: owner only.
- research runs/jobs/evidence/intelligence: owner can read; direct client writes should be restricted where server orchestration owns integrity.
- product concepts/disposition: owner can update permitted user-disposition fields; analytical fields are server-owned.
- projects/Blueprint: owner can read; draft edits allowed through guarded APIs where cross-entity integrity matters; published version mutation denied.
- AI configurations: owner can read/update safe configuration fields; secrets never stored in client-readable table fields.

## Sensitive Tables

Consider denying direct browser mutation and exposing RPC/Edge Function operations for:
- score snapshots;
- recommendations;
- kill assessments;
- AI invocation ledger;
- research jobs;
- published Blueprint versions;
- quality reports.

## Production Signup

Disable or gate signups at the Supabase project/config level. Do not rely only on hiding a Register page.

## Authorization Tests

Automated tests must verify:
- unauthenticated user cannot read data;
- wrong user ID cannot read/write owner records (test with second fixture user even if product is single-user);
- browser user cannot insert forged score/recommendation rows;
- browser user cannot mutate published versions;
- service-side trusted path can perform required automation.
