# Figma and Prototype Specification

## Principle

The Blueprint is canonical. Figma and internal prototype output are derived artifacts.

## Internal Prototype

The platform renders a lightweight interactive preview using structured JSON from the current Blueprint version.

Prototype spec must contain:
- screen stable ID;
- title/purpose;
- viewport/device profile;
- hierarchy of layout blocks/components;
- text content or content intent;
- component variants;
- states;
- interactions/actions;
- navigation target IDs;
- conditional transitions where needed;
- design-token references;
- requirement/feature/rule trace links.

Internal prototype goals:
- verify information architecture;
- verify screen inventory;
- verify user flows/navigation;
- review loading/empty/error/permission/offline states;
- create a fast clickable preview.

Internal prototype non-goals:
- pixel-perfect final product design editor;
- arbitrary vector design tooling;
- replacing Figma.

## Figma Integration Boundary

Define an interface similar to:

```ts
interface FigmaAdapter {
  createArtifact(input: PrototypeExportPayload): Promise<FigmaArtifactRef>
  updateArtifact(input: PrototypeExportPayload, target: FigmaArtifactRef): Promise<FigmaArtifactRef>
  getArtifactStatus(ref: FigmaArtifactRef): Promise<FigmaArtifactStatus>
}
```

Do not couple Blueprint generation directly to one Figma transport.

## Recommended V1 Figma Path

Use a small companion Figma plugin because the Figma Plugin API can create and update design nodes inside an open Figma file. The platform generates a signed/short-lived export payload or downloadable JSON bundle. The user runs the plugin in Figma, authenticates/imports the payload, and the plugin creates editable frames/components/text using stable IDs stored in plugin data.

This avoids assuming server-side Figma REST endpoints can arbitrarily create design nodes.

## Figma Plugin Responsibilities

- import prototype payload;
- create/update a dedicated page/section;
- use stable `SCR-*` and component keys;
- create Auto Layout-based frames where feasible;
- map semantic tokens to Figma variables/styles if available;
- preserve user-owned unrelated nodes;
- write platform identifiers into plugin data;
- report created/updated node IDs back to the platform through authenticated API or export receipt;
- never silently delete user-edited nodes without explicit reconciliation mode.

## Reconciliation

Each artifact stores:
- project ID;
- Blueprint version ID;
- Figma file key/reference;
- plugin artifact namespace;
- screen stable ID -> node ID map;
- created/updated time;
- status current/stale/failed.

If Blueprint v4 changes `SCR-003` and `SCR-007`, only those mappings become stale.

## High-Fidelity Strategy

V1 may generate visually coherent frames using the Blueprint design system. Future versions may add Figma Make-assisted prompts or richer design generation, but the product must not depend on undocumented automation endpoints.
