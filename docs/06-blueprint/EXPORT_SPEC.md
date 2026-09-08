# Blueprint Export Specification

## Preconditions

Export can be generated for any published version, but only exports from a Blueprint that passes readiness gates may be labeled `Ready for Development`.

## Export Process

1. select published Blueprint version;
2. render canonical documents from version snapshot;
3. render thin agent adapters;
4. write prototype JSON and Figma handoff payload;
5. generate MANIFEST with checksums/version metadata;
6. validate all internal links/stable IDs;
7. scan for accidental secrets;
8. create ZIP;
9. store in private Supabase Storage;
10. return a short-lived signed download URL.

## Agent Adapters

Adapters must never duplicate full requirements.

Example `KIMI.md` content:

```text
Read AGENTS.md first. Use product/PRD.md, ux/SCREENS.md,
technical/ARCHITECTURE.md, and execution/TASKS.md as canonical implementation inputs.
Implement tasks in dependency order. Do not invent product behavior.
```

Claude/Codex/Gemini files may contain tool-specific hints only.

## Manifest Validation

Fail export if:
- required file missing;
- duplicate stable IDs appear in incompatible places;
- manifest references nonexistent file;
- current published version and rendered source version differ;
- prohibited secret patterns detected;
- prototype JSON fails schema/semantic validation.
