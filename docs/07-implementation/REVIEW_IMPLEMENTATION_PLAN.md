# Approved review implementation

The owner authorized implementing the complete review recommendations on 2026-09-08. The existing app remains personal-use, English/Cairo, evidence-first, with immutable published Blueprints and no generated production Flutter app.

## Work ownership

- Backend agent: analysis/Blueprint atomicity and idempotency, risk contracts, score rubrics, queue retries, history/aggregation, AI budget enforcement and regression tests.
- UI agent: shell/accessibility, responsive layout, project URLs, readable entity/version differences and dashboard decision priority.
- Features agent: evidence provenance, owner-imported review data, comparison/filter/read models, validation records, scoped refresh interface and associated tests.
- Integration owner: API routes/contracts, Settings budgets, export readiness/security, applying additive migrations, integration/regression tests, runtime verification and documentation.

## Required acceptance

1. Zero run/role budget is respected; unset is distinct from zero. Global budgets remain enforced.
2. Invalid/partial analysis cannot publish a usable recommendation. A retried Blueprint job creates exactly one version and review job.
3. Every mandatory kill rule is evaluated; graph gates verify typed coverage and actual navigation reachability.
4. New evidence states its observed market/platform/language; global requested scope does not relabel a US observation. Opposing evidence is retained.
5. Idea comparisons pair recommendations with their exact score/confidence snapshots; filters/sorts operate before pagination; latest/current records remain available with long histories.
6. Scoped refresh reuses the concept and preserves published project snapshots. Review import includes explicit source provenance and validation, without invented live samples.
7. Keyboard focus, dialogs, mobile widths, document/version routes and readable differences work in the browser.
8. Every export file and the manifest are validated/scanned; publication verifies an export package can be created in private storage.
9. Local tests, database advisors, browser workflows and a bounded real AI/Edge smoke test pass. Production account access and actual Figma import remain separate external checks.

Optional validation records approved with this review are limited to a question, proposed check, success/failure threshold, source/result and resulting decision. They do not introduce teams, CRM, outbound messaging or automatic purchases.
