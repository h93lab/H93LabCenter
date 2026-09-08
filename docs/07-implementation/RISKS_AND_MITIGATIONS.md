# Platform Risks and Mitigations

## 1. Weak Free Data Coverage
Risk: free/public sources cannot reproduce proprietary mobile-intelligence metrics.
Mitigation: evidence-first confidence, optional paid adapters, never fabricate missing metrics, focus on user voice/local gaps/signals available legally.

## 2. Source Instability
Risk: public pages/APIs change.
Mitigation: adapters, parser versions, source health, fixtures, graceful partial runs.

## 3. AI Hallucination
Risk: persuasive unsupported analysis.
Mitigation: provenance, schemas, evidence IDs, unknown values, deterministic scoring, consistency review.

## 4. Runaway Cost
Risk: daily wide discovery becomes expensive.
Mitigation: cheap-to-expensive escalation, budgets, deep-candidate caps, invocation ledger, anomaly detection.

## 5. Duplicate Noise
Risk: same ideas repeatedly generated.
Mitigation: pgvector + structured dedupe + timeline updates + policy versioning.

## 6. Blueprint Drift
Risk: documents contradict after edits.
Mitigation: structured canonical entities, change impact graph, immutable versions, validators, generated derived docs.

## 7. Figma Integration Fragility
Risk: assuming unsupported server-side design creation.
Mitigation: adapter abstraction and Plugin API-based handoff path.

## 8. Scope Explosion
Risk: platform expands into code generation/project management.
Mitigation: source-of-truth boundary at Ready for Development and explicit exclusions.

## 9. Single-User Security Complacency
Risk: disabling RLS because only one owner uses the app.
Mitigation: full owner auth/RLS, service-side secrets, negative security tests.

## 10. False Precision
Risk: scores/estimates appear more certain than evidence.
Mitigation: score explanation, confidence separate, source/estimate labels, market-specific dates, contradiction display.
