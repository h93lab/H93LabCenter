# Test Strategy

## Test Layers

### Unit
Required for:
- scoring calculations;
- confidence calculations;
- recommendation thresholds;
- kill-gate precedence;
- dedupe decision helpers;
- state transitions;
- budget calculations;
- schema validators;
- Blueprint quality rules.

### Database
Test:
- migrations from clean database;
- constraints/unique keys;
- RLS owner/no-owner behavior;
- immutable published versions;
- score/recommendation insertion permissions;
- important RPC transactions.

### Edge Function Integration
Test with provider mocks:
- authenticated/unauthenticated calls;
- input validation;
- idempotency;
- transient retry classification;
- invalid AI schema repair/failure;
- budget-limited behavior;
- partial source failure;
- GO transaction;
- change apply conflict/version mismatch.

### Frontend Component/Integration
Test:
- loading/empty/error/partial states;
- filters URL persistence;
- score explanation;
- Idea of the Day/no-opportunity state;
- GO confirmation;
- Blueprint edit/version protections;
- change impact preview;
- quality blockers.

### End-to-End
Critical flows:
1. login -> manual research -> run completion -> idea analysis;
2. no qualifying daily idea;
3. score/evidence drill-down;
4. GO -> Blueprint generation;
5. AI change -> impact -> apply -> version diff;
6. prototype -> stale after screen change -> regenerate;
7. quality gates -> Ready -> export.

## Determinism Fixtures

Use fixed factor fixtures to assert exact score outputs. Historical score version tests prevent accidental changes to APP-1.0/GAME-1.0.

## AI Tests

Do not depend on live model wording in normal CI. Use recorded/fixture schema outputs and contract tests. Have an optional manual/live-provider smoke suite outside every commit.

## Source Adapter Tests

Use fixtures for parsing. Live source tests should be rate-limited/manual because external pages/APIs change.

## Accessibility

Use automated axe-like checks where compatible plus keyboard/manual checks for dialogs, sheets, tables, editor, and critical decision flows.

## Figma Plugin

Test import against fixture payloads and verify stable ID update behavior. Never require a live user Figma file in main backend CI.
