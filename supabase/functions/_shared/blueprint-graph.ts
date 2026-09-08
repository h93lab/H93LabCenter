import type { Blueprint } from "./domain.ts";
export const blueprintRelations = [
  "supports",
  "derived_from",
  "implements",
  "implemented_by",
  "displayed_on",
  "shown_on",
  "governed_by",
  "depends_on",
  "validated_by",
  "tested_by",
  "affects",
  "supersedes",
  "contradicts",
  "covered_by",
] as const;

export function blueprintGraph(b: Blueprint) {
  const families = {
    requirement: b.requirements,
    feature: b.features,
    rule: b.rules,
    screen: b.screens,
    flow: b.flows,
    decision: b.decisions,
    task: b.tasks,
    test: b.tests,
  };
  const kinds = new Map(
    Object.entries(families).flatMap(([kind, rows]) =>
      rows.map((row) => [row.stable_key, kind] as const),
    ),
  );
  const canonical = (kind: string) =>
    kind.replace(/^blueprint_/, "").replace(/s$/, "");
  const relations = new Set<string>(blueprintRelations);
  const refs = b.links.every(
    (l) =>
      l.source_key !== l.target_key &&
      kinds.get(l.source_key) === canonical(l.source_kind) &&
      kinds.get(l.target_key) === canonical(l.target_kind) &&
      relations.has(l.relation),
  );
  const linked = (a: string, keys: string[]) =>
    b.links.some(
      (l) =>
        !["contradicts", "supersedes", "depends_on", "affects"].includes(
          l.relation,
        ) &&
        ((l.source_key === a && keys.includes(l.target_key)) ||
          (l.target_key === a && keys.includes(l.source_key))),
    );
  const reqs = b.requirements.map((r) => r.stable_key),
    features = b.features.map((f) => f.stable_key),
    screens = b.screens.map((s) => s.stable_key),
    flows = b.flows.map((f) => f.stable_key);
  const product = b.requirements.every(
    (r) =>
      r.acceptance_criteria.length > 0 &&
      (linked(r.stable_key, features) ||
        b.tasks.some((t) => t.implements.includes(r.stable_key))),
  );
  const scope = b.features.every((f) => linked(f.stable_key, reqs));
  // A headless feature must declare that fact explicitly in its canonical data notes.
  const ux =
    b.features.every(
      (f) =>
        /^headless:/i.test(f.data.notes.trim()) ||
        linked(f.stable_key, screens) ||
        b.flows.some(
          (flow) =>
            linked(f.stable_key, [flow.stable_key]) &&
            flow.steps.some((s) => screens.includes(s)),
        ),
    ) &&
    b.screens.every(
      (s) => linked(s.stable_key, features) || linked(s.stable_key, flows),
    );
  const edges = new Map(
    b.screens.map((s) => [
      s.stable_key,
      [
        ...new Set([
          ...s.navigation,
          ...s.components.flatMap((c) => (c.target ? [c.target] : [])),
        ]),
      ],
    ]),
  );
  const roots = b.screens
    .filter(
      (s, i) =>
        i === 0 ||
        s.entry_points.some((p) =>
          /^(app )?launch$|^deep[ -]?link|^notification/i.test(p),
        ),
    )
    .map((s) => s.stable_key);
  const reachable = new Set<string>();
  const visit = (key: string) => {
    if (reachable.has(key)) return;
    reachable.add(key);
    for (const next of edges.get(key) || []) visit(next);
  };
  roots.forEach(visit);
  const navigation =
    b.screens.every(
      (s) =>
        reachable.has(s.stable_key) &&
        (edges.get(s.stable_key) || []).every((k) => screens.includes(k)),
    ) &&
    b.flows.every(
      (f) =>
        f.steps.length > 0 &&
        f.steps.every(
          (step, i) =>
            screens.includes(step) &&
            (i === 0 ||
              step === f.steps[i - 1] ||
              edges.get(f.steps[i - 1])?.includes(step)),
        ),
    );
  return { refs, product, scope, ux, navigation };
}
