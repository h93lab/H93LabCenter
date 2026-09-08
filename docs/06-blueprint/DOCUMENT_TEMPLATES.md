# Blueprint Document Content Templates

This file defines mandatory content for each exported document.

## `product/PRODUCT.md`

1. Product one-liner
2. Mission
3. Problem
4. Target user / JTBD
5. Why now
6. Winning wedge
7. Primary markets
8. Product principles
9. Success criteria
10. Non-goals

## `product/PRD.md`

- context/research summary;
- scope;
- personas/JTBD;
- functional requirements by stable ID;
- non-functional requirements;
- acceptance behavior;
- edge cases;
- out-of-scope behavior;
- unresolved assumptions.

## `product/FEATURES.md`

For each `FEAT-*`:
- name;
- outcome;
- description;
- linked requirements;
- priority MVP/later;
- dependencies;
- business rules;
- screens;
- research/product decision trace;
- explicit non-behavior.

## `product/REQUIREMENTS.md`

For each `REQ-*`:
- normative “must” statement;
- rationale;
- acceptance criteria;
- related feature/screen/rule/test;
- source decision/evidence when applicable.

## `product/BUSINESS_RULES.md`

For each `RULE-*`:
- condition;
- behavior;
- exceptions;
- user-visible result;
- data/analytics effect;
- related requirement/screen/test.

## `product/DECISIONS.md`

For each `DEC-*`:
- decision;
- alternatives considered;
- rationale;
- research evidence/assumption;
- consequences;
- affected artifacts.

## `ux/DESIGN.md`

- design direction and principles;
- theme modes;
- color/typography/spacing/radius/icon/motion tokens;
- component behavior;
- platform-adaptive guidance;
- accessibility;
- content tone;
- state presentation.

## `ux/USER_FLOWS.md`

For each `FLOW-*`:
- trigger;
- preconditions;
- ordered steps;
- screen transitions;
- alternative/error exits;
- completion condition;
- rules/requirements.

## `ux/SCREENS.md`

For each `SCR-*`:
- purpose;
- entry points;
- content/components;
- actions;
- navigation;
- relevant states (default/loading/empty/error/offline/permission/partial/success);
- business rules;
- analytics events;
- accessibility behavior;
- requirements/features.

## `technical/ARCHITECTURE.md`

- Flutter architecture choice and why;
- package/module organization;
- state management;
- navigation;
- dependency-injection policy if needed;
- backend/no-backend choice;
- caching/offline strategy;
- environment config;
- error handling;
- platform-specific behavior;
- dependency policy;
- technical non-goals.

## `technical/DATA_MODEL.md`

- entities;
- fields/types;
- relationships;
- source of truth;
- local vs remote data;
- persistence/retention;
- migrations/versioning expectations;
- sensitive-data classification.

## `technical/INTEGRATIONS.md`

For each integration:
- purpose;
- provider choice and alternatives;
- auth model;
- API boundary;
- failure/retry behavior;
- rate/cost limits;
- platform configuration;
- privacy/security implications;
- test strategy.

## `execution/TASKS.md`

For each task:
- stable `TASK-*` ID;
- objective;
- dependencies;
- exact requirements/features/screens/rules implemented;
- implementation guidance;
- test obligations;
- Definition of Done;
- explicit not-in-scope.

## `execution/TESTING.md`

Map `TEST-*` to requirement/rule/flow. Include unit, widget, integration, platform, accessibility, purchase/auth/offline/error tests as applicable.
