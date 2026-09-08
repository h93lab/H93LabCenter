# Generated Build Package Specification

## Purpose

The exported package is the final handoff from market research to implementation. It must allow a competent AI coding agent to implement the Flutter product without inventing product behavior.

## Export Layout

```text
<project-slug>/
  README.md
  AGENTS.md
  CLAUDE.md
  KIMI.md
  CODEX.md
  GEMINI.md
  MANIFEST.json

  product/
    PRODUCT.md
    PRD.md
    FEATURES.md
    REQUIREMENTS.md
    BUSINESS_RULES.md
    DECISIONS.md

  ux/
    DESIGN.md
    INFORMATION_ARCHITECTURE.md
    USER_FLOWS.md
    SCREENS.md
    COMPONENTS.md
    ACCESSIBILITY.md

  technical/
    ARCHITECTURE.md
    DATA_MODEL.md
    INTEGRATIONS.md
    SECURITY.md
    ANALYTICS.md
    PLATFORM_NOTES.md

  business/
    MONETIZATION.md
    ASO.md
    LAUNCH_VALIDATION.md

  research/
    MARKET.md
    COMPETITORS.md
    USER_VOICE.md
    EVIDENCE_SUMMARY.md
    TRACEABILITY.md

  execution/
    ROADMAP.md
    TASKS.md
    TESTING.md
    DEFINITION_OF_DONE.md

  prototype/
    prototype.json
    README.md
    figma-handoff.json
```

Do not generate dozens of redundant Markdown files when content can be coherently grouped. The above is the standard V1 package; omit an optional document only when genuinely not applicable and record that in MANIFEST.

## Root Agent Files

### `AGENTS.md`
Canonical agent-agnostic rules. Contains product-specific non-negotiables, source-of-truth priority, implementation order, no-invention rule, Flutter constraints, testing/security rules.

### `CLAUDE.md`, `KIMI.md`, `CODEX.md`, `GEMINI.md`
Thin adapters. They should point the agent to `AGENTS.md` and canonical documents and may explain tool-specific workflow. They must not duplicate the entire requirements set.

## Manifest

`MANIFEST.json` fields:
- project ID/name/slug;
- Blueprint version;
- generated time;
- source idea/research snapshot IDs;
- file list;
- SHA-256 per file;
- document/schema version;
- prototype version;
- quality score/gate summary;
- compatible agent profiles;
- Flutter target version policy (e.g. latest stable at implementation time unless Blueprint pins a reasoned version).

## Content Rule

Every generated claim about the market that influences implementation should either:
- reference a traceability/decision ID linked to research evidence; or
- be explicitly labeled as product/architecture judgment rather than market fact.

## No Production Code

The export may include examples/pseudocode/data schemas when needed to remove ambiguity, but it must not contain a complete generated Flutter application. The coding agent creates production code from this package.
