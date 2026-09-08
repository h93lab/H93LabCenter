# Flutter Development Profile for Generated Projects

## Fixed Preferences

- Framework: Flutter.
- Language: Dart.
- Targets: iOS and Android.
- Development style: AI-first implementation.
- Agent compatibility: agent-agnostic, Claude Code default adapter.

## Adaptive Technical Decisions

The Blueprint must choose rather than blindly hardcode:
- state-management approach;
- navigation solution;
- local persistence;
- backend/no-backend;
- Supabase usage;
- authentication;
- push notifications;
- analytics/crash reporting;
- payments/subscriptions;
- image/media stack;
- offline/background behavior.

## Default Preference Heuristics

### Architecture
Prefer feature-first modular organization. Use additional clean/domain/data layering only when product complexity benefits from it.

### State Management
Prefer a modern, testable approach such as Riverpod when state complexity warrants it, but simple local state remains acceptable for trivial screens. The Blueprint must state the choice.

### Navigation
Prefer a declarative router appropriate to the app's deep-link/auth complexity (commonly GoRouter), but document alternatives if the app is very small.

### Backend
Use Supabase when remote auth/database/storage/functions/realtime materially help. Do not add a backend to a fully local utility without need.

### Purchases
Choose an abstraction such as RevenueCat when subscription/IAP complexity justifies it; direct store APIs may be sufficient for simpler cases. The Blueprint explains the choice.

## Generated Technical Requirements

The final package must define:
- folder/module structure;
- dependency policy;
- environment handling;
- theme/design token strategy;
- error model;
- network/retry/caching behavior;
- analytics events;
- tests;
- iOS/Android permissions/capabilities;
- release configuration considerations;
- Definition of Done.

## No Invention Rule for Coding Agent

Generated `AGENTS.md` must tell the coding agent:
- do not add features outside specs;
- do not change architecture without updating the decision record;
- do not change data model without updating technical docs;
- do not omit defined screen states;
- do not replace monetization behavior with a simpler interpretation;
- if specs conflict, follow the exported source-of-truth priority and surface conflict.
