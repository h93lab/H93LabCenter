# Blueprint Quality Gates

## Purpose

Prevent “Ready for Development” when the generated package is merely verbose but incomplete or contradictory.

## Mandatory Gates

### QG-01 Product Coverage
Every MVP feature has requirements and every requirement has acceptance behavior.

### QG-02 Scope Integrity
No generated MVP feature exists outside accepted scope without an explicit decision.

### QG-03 UX Coverage
Every user-visible MVP capability maps to at least one screen/flow or explicitly headless behavior.

### QG-04 Screen States
Relevant loading/empty/error/offline/permission/partial states are defined for data/permission/network-sensitive screens.

### QG-05 Navigation Integrity
Every navigation action has a valid target/exit and no inaccessible required screen exists.

### QG-06 Business Rule Coverage
Critical business/monetization/access/limit rules map to requirements and tests.

### QG-07 Data/Integration Consistency
Features/screens/rules that require data or integrations are reflected in the technical plan.

### QG-08 Security/Privacy
Sensitive data, auth, storage, permissions, external APIs, and platform privacy requirements are addressed.

### QG-09 Analytics Coverage
Critical product/monetization/validation events are defined where analytics are part of product strategy.

### QG-10 Test Traceability
Critical requirements/rules have tests; all MVP flows have test strategy.

### QG-11 Research Traceability
Major wedge/differentiation/product decisions retain research or explicit judgment trace.

### QG-12 Prototype Consistency
Internal prototype screen/flow IDs match current Blueprint. Figma artifact may be stale while internal prototype is current, but project cannot claim Figma-current status incorrectly.

### QG-13 Agent Handoff Completeness
Export package includes AGENTS.md, tasks, architecture, screens, rules, tests, and Definition of Done with no broken references.

## Quality Score

Quality Score 0–100 may summarize gate coverage, but mandatory gate failure blocks Ready for Development regardless of score.

Suggested weights:
- product 15;
- UX 15;
- technical 15;
- rules/data 10;
- tests 10;
- traceability 10;
- security/privacy 10;
- prototype 5;
- agent handoff 10.

## Readiness

`READY_FOR_DEVELOPMENT` requires:
- all mandatory gates pass;
- no severity-critical consistency finding;
- latest published Blueprint version is current;
- internal prototype is current;
- export package can be generated successfully.
