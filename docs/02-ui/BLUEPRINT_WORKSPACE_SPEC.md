# Blueprint Workspace UI Specification

## Goal

Make a generated Project Blueprint inspectable, editable, versioned, and exportable without turning the platform into an IDE.

## Workspace Header

Show:
- project name;
- source idea link;
- Blueprint current version;
- Blueprint state;
- Blueprint quality score;
- prototype state;
- last updated;
- actions: `Ask AI to Change`, `Validate`, `Create Version`, `Export`, `Ready for Development`.

`Ready for Development` is disabled while mandatory quality gates fail.

## Overview Tab

Show pipeline status:

```text
Research Snapshot ✓
Product Definition ✓
Requirements ✓
UX & Flows ✓
Technical Plan ✓
Prototype ✓ / stale
Consistency Review ✓
Quality Gates 11/12
Ready for Development ○
```

Show blockers with direct navigation.

## Blueprint Document Tab

Left pane:
- grouped document tree;
- status indicator current/stale/invalid;
- unsaved draft indicator.

Center:
- Markdown rich editor or Markdown-first editor with preview;
- stable entity references rendered as chips/links;
- edit mode only for draft.

Right pane:
- document metadata;
- traced entities;
- affected-by change history;
- validator warnings;
- source research decisions.

## Structured Entity Tabs

Features/Screens/Rules/Requirements/Tasks should not exist only as prose. Provide list/detail views backed by structured database entities.

Example Screen detail:
- `SCR-005`
- name/purpose
- entry points
- components
- states (default/loading/empty/error/offline/permission/etc.)
- actions
- navigation
- related requirements/rules/events
- prototype node link
- version history.

## AI Change Chat

Chat is change-management UI, not a general assistant.

Flow:
1. user writes change;
2. system creates Change Request;
3. analysis returns affected artifacts and proposed changes;
4. UI displays impact table before applying;
5. user applies or cancels;
6. affected draft data changes transactionally;
7. validators run;
8. new version may be published after clean validation.

Impact table columns:
- artifact ID/path;
- type;
- change action (add/update/remove/review);
- reason;
- risk;
- automatic/manual review.

## Version Diff

Support:
- document Markdown diff;
- structured entity added/removed/changed;
- prototype affected screens;
- quality score delta;
- decision changes;
- migration/data contract changes in generated technical plan.

## Protection

- Published versions are read-only.
- Editing begins by forking current published version into a draft.
- Do not allow two simultaneous draft mutations from separate AI changes without serializing/locking change application.
