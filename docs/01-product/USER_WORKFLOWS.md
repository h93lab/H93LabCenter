# User Workflows

## Workflow 1 — Daily Review

1. Owner opens Dashboard.
2. Dashboard shows latest research-run state and today’s best opportunities.
3. If a promoted Idea of the Day exists, it is highlighted.
4. Owner opens the idea detail page.
5. Page shows score, confidence, recommendation, market scores, trend, why-now, competitors, reviews, gaps, monetization, distribution, risks, kill results, evidence, and history.
6. Owner may open Executive Brief for concise decision guidance.
7. Owner chooses GO, Watch, or Pass.

### Empty Daily State

If no idea meets promotion thresholds:

- show `No High-Confidence Opportunity Today`;
- show the best candidate and why it was not promoted;
- allow exploration of all discovered candidates.

## Workflow 2 — Compare Opportunities

1. Owner opens Opportunities/Ideas list.
2. Filters by app/game, market, category, opportunity type, recommendation, confidence, score, date, and trend direction.
3. Selects up to a small number for comparison.
4. Comparison view normalizes score factors and highlights market-specific differences, incumbent pressure, evidence confidence, build burden, and wedge.

## Workflow 3 — Evidence Drill-Down

1. Owner clicks a score or claim.
2. Side panel shows factor explanation, weights, calculation version, confidence and linked claims.
3. Claim opens evidence references with source, collection date, published date, market/language, verification status, and short relevant excerpt/summary.
4. Contradictory evidence is shown rather than hidden.

## Workflow 4 — GO to Blueprint

1. Owner clicks GO on a concept.
2. System confirms the chosen concept and current research snapshot.
3. System creates a Project and Blueprint draft.
4. Blueprint pipeline produces structured product/UX/technical/business/execution content.
5. Consistency reviewer checks contradictions/missing coverage.
6. Internal prototype spec is generated and rendered.
7. Owner reviews and edits documents or uses AI Change Chat.

## Workflow 5 — AI Blueprint Change

1. Owner requests a change, e.g. “Change monetization from subscription to lifetime purchase.”
2. Change manager parses the requested intent.
3. System calculates affected entities/documents/screens/flows/rules/events/tasks/prototype elements.
4. UI shows proposed impact and risks before applying.
5. Owner applies the change.
6. System produces a new draft from the prior version, updates affected artifacts, validates consistency, and publishes a new immutable version only if validation passes.
7. Version diff is shown.

## Workflow 6 — Figma Handoff

1. Owner opens Prototype tab.
2. Reviews internal preview and structured screen inventory.
3. Chooses Create/Update Figma artifact.
4. Platform provides integration payload to the configured Figma adapter.
5. If using a Figma plugin, owner opens the plugin in the target Figma file and imports the payload.
6. Plugin creates/updates editable nodes using stable screen/component identifiers.
7. Platform stores Figma file/node references and Blueprint version.
8. Later Blueprint changes mark affected Figma artifacts stale.

## Workflow 7 — Ready for Development

1. Owner opens Quality panel.
2. All mandatory gates run.
3. Any failure links directly to missing/inconsistent artifacts.
4. Once all mandatory gates pass, owner marks/publishes Ready for Development.
5. System generates export ZIP with manifest, docs, prototype spec, research summary, and agent adapters.
