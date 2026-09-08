# Security Specification

## Threat Model

Primary threats include:
- leaked service/provider keys;
- owner-session compromise;
- RLS misconfiguration;
- prompt injection from web/review evidence;
- malicious HTML/Markdown in external content;
- over-permissive Figma/plugin exchange;
- runaway AI costs;
- forged score/recommendation records from client;
- unsafe ZIP/export file generation;
- dependency/supply-chain vulnerabilities.

## Secret Handling

- Vite env values are public by definition; only publishable Supabase values may use `VITE_*`.
- Supabase service role and third-party API keys live in Edge Function secrets/Vault.
- Never place provider keys in database rows readable by browser.
- Redact secrets from errors/logs.

## External Content

- sanitize rendered HTML;
- preferably render Markdown using a safe parser with HTML disabled/sanitized;
- treat URLs as data;
- LLM prompts explicitly isolate untrusted evidence;
- never execute scripts or shell commands derived from source content.

## Edge Function Controls

- validate JWT for owner operations;
- validate input schemas;
- validate ownership;
- rate-limit expensive manual actions;
- idempotency for mutations;
- budget checks before AI/provider calls;
- restrict CORS to known app origins where compatible with deployment.

## Figma Plugin Exchange

If a plugin fetches a prototype payload:
- use short-lived one-time or scoped tokens;
- token grants access only to one project/version payload;
- do not embed Supabase service credentials in plugin bundle;
- validate user ownership on token issuance;
- record import receipt without trusting arbitrary node data as canonical product truth.

## Export Safety

- sanitize generated path names;
- prohibit `../` path traversal;
- deterministic allowlist of export paths;
- no secret/config values in exported Blueprint files;
- scan generated manifest for accidental secret patterns before archive finalization where feasible.

## Dependency Security

- pin/lock dependencies;
- automated dependency audit in CI;
- review high-impact package changes;
- avoid adding scraping/automation packages that bypass access controls.
