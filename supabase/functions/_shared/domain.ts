import { z } from "zod";
import { signalTypes, opportunityTypes } from "./taxonomy.ts";
import { blueprintGraph, blueprintRelations } from "./blueprint-graph.ts";
export { appWeights, gameWeights, confidenceWeights } from "./scoring.ts";
export function weighted(
  values: Record<string, number>,
  weights: Record<string, number>,
): number {
  if (Object.values(weights).reduce((a, b) => a + b, 0) !== 100)
    throw new Error("INVALID_WEIGHTS");
  let sum = 0;
  for (const [k, w] of Object.entries(weights)) {
    const v = values[k];
    if (!Number.isFinite(v) || v < 0 || v > 100 || w < 0)
      throw new Error("INVALID_FACTOR_" + k);
    sum += v * w;
  }
  return Math.round(sum) / 100;
}
export function recommend(
  score: number,
  confidence: number,
  killed: boolean,
  unknowns: string[] = [],
): string {
  if (killed) return "KILLED";
  if (unknowns.length && score >= 60) return "VALIDATE_FIRST";
  if (score >= 85 && confidence >= 75) return "STRONG_BUILD";
  if (score >= 75 && confidence >= 65) return "BUILD";
  if (score >= 70) return "VALIDATE_FIRST";
  if (score >= 60) return "WATCH";
  return "PASS";
}
export function localDate(timezone: string, date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
export function scheduleDue(timezone: string, time: string, date = new Date()) {
  const value = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
  return value >= time.slice(0, 5);
}
export function normalize(text: string) {
  return text
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
export function similarity(a: string, b: string) {
  const x = new Set(normalize(a).split(" ")),
    y = new Set(normalize(b).split(" "));
  return [...x].filter((v) => y.has(v)).length / new Set([...x, ...y]).size;
}
export async function sha(text: string | Uint8Array) {
  const bytes =
    typeof text === "string" ? new TextEncoder().encode(text) : text;
  return Array.from(
    new Uint8Array(
      await crypto.subtle.digest("SHA-256", bytes as BufferSource),
    ),
  )
    .map((v) => v.toString(16).padStart(2, "0"))
    .join("");
}
export async function stableId(key: string) {
  const h = await sha(key);
  return (
    h.slice(0, 8) +
    "-" +
    h.slice(8, 12) +
    "-4" +
    h.slice(13, 16) +
    "-a" +
    h.slice(17, 20) +
    "-" +
    h.slice(20, 32)
  );
}
const text = z.string().min(1);
const texts = z.array(text);
const score = z.number().min(0).max(100);
const ids = z.array(z.string().uuid()).min(1);
export const killRules = [
  "prohibited",
  "unavailable_dependency",
  "unsustainable_economics",
  "no_credible_wedge",
  "solo_maintenance",
  "platform_policy",
  "safety_liability",
] as const;
export const extractedSchema = z.object({
  claims: z.array(
    z.object({
      evidence_ids: ids,
      evidence_links: z
        .array(
          z.object({
            evidence_id: z.string().uuid(),
            relation: z.enum([
              "supports",
              "contradicts",
              "contextualizes",
              "estimates",
            ]),
            strength: score,
            rationale: text,
          }),
        )
        .min(1),
      text,
      verification: z.enum([
        "supported",
        "inferred",
        "estimated",
        "unknown",
        "contradicted",
      ]),
      confidence: score,
    }),
  ),
  signals: z.array(
    z.object({
      evidence_ids: ids,
      title: text,
      summary: text,
      type: z.enum(signalTypes),
      direction: z.enum(["positive", "negative", "mixed", "neutral"]),
      strength: z.enum(["weak", "moderate", "strong", "extreme"]),
      confidence: score,
    }),
  ),
});
export const opportunitySchema = z.object({
  opportunities: z
    .array(
      z.object({
        title: text,
        problem: text,
        jtbd: text,
        audience: text,
        why_now: text,
        type: z.enum(opportunityTypes),
        app_or_game: z.enum(["app", "game"]),
        evidence_ids: ids,
        concepts: z
          .array(
            z.object({
              title: text,
              value_proposition: text,
              target_user: text,
              wedge: text,
              mvp_thesis: text,
              monetization: texts,
              distribution: texts,
            }),
          )
          .min(1)
          .max(2),
      }),
    )
    .max(5),
});
export const factorSchema = z.object({
  value: score,
  rationale: text,
  evidence_ids: z.array(z.string().uuid()),
});
const riskBase = {
  rule: z.enum(killRules),
  severity: z.literal("hard"),
  rationale: text,
};
export const riskAssessmentSchema = z.union([
  z.object({
    ...riskBase,
    result: z.enum(["pass", "fail"]),
    evidence_ids: ids,
  }),
  z.object({
    ...riskBase,
    result: z.literal("unknown"),
    evidence_ids: z.array(z.string().uuid()),
  }),
]);
export const analysisSchema = z.object({
  market_code: text,
  factors: z.record(text, factorSchema),
  confidence: z.object({
    quality: score,
    diversity: score,
    recency: score,
    agreement: score,
    coverage: score,
    specificity: score,
  }),
  critical_unknowns: texts,
  risks: z.array(riskAssessmentSchema).length(killRules.length),
  competitors: z.array(
    z.object({
      name: text,
      url: z.string(),
      relation: z.enum(["direct", "indirect", "substitute"]),
      strengths: texts,
      weaknesses: texts,
      evidence_ids: ids,
    }),
  ),
  review_clusters: z.array(
    z.object({
      theme: text,
      category: text,
      sentiment: text,
      sample_size: z.number().int().min(1),
      member_count: z.number().int().min(1),
      summary: text,
      evidence_ids: ids,
    }),
  ),
  gap: text,
  monetization: text,
  distribution: text,
  executive_brief: text,
  validation_priorities: texts,
});
export function validateAnalysisEvidence(
  result: z.infer<typeof analysisSchema>,
  evidence: { id: string; source_type: string }[],
) {
  analysisSchema.parse(result);
  const allowed = new Set(evidence.map((e) => e.id));
  const seenRules = new Set(result.risks.map((r) => r.rule));
  if (
    seenRules.size !== killRules.length ||
    killRules.some((rule) => !seenRules.has(rule))
  )
    throw Error("INCOMPLETE_KILL_ASSESSMENT");
  for (const factor of Object.values(result.factors))
    if (factor.evidence_ids.length)
      assertEvidence(factor.evidence_ids, allowed);
  for (const risk of result.risks) {
    if (risk.result !== "unknown" || risk.evidence_ids.length)
      assertEvidence(risk.evidence_ids, allowed);
  }
  for (const competitor of result.competitors) {
    assertEvidence(competitor.evidence_ids, allowed);
    let url: URL;
    try {
      url = new URL(competitor.url);
    } catch {
      throw Error("INVALID_COMPETITOR_URL");
    }
    if (!["https:", "http:"].includes(url.protocol))
      throw Error("INVALID_COMPETITOR_URL");
  }
  for (const review of result.review_clusters) {
    assertEvidence(review.evidence_ids, allowed);
    if (
      review.evidence_ids.some(
        (id) =>
          evidence.find((e) => e.id === id)?.source_type !== "user_review",
      )
    )
      throw Error("INVALID_REVIEW_EVIDENCE");
  }
}
export function validateClaimLinks(
  claim: z.infer<typeof extractedSchema>["claims"][number],
  allowed: Set<string>,
) {
  assertEvidence(claim.evidence_ids, allowed);
  const linked = new Set(claim.evidence_links.map((l) => l.evidence_id));
  if (
    linked.size !== new Set(claim.evidence_ids).size ||
    claim.evidence_ids.some((id) => !linked.has(id))
  )
    throw Error("UNSUPPORTED_EVIDENCE_REFERENCE");
  assertEvidence([...linked], allowed);
  const unique = new Set(
    claim.evidence_links.map((l) => l.evidence_id + ":" + l.relation),
  );
  if (unique.size !== claim.evidence_links.length)
    throw Error("DUPLICATE_CLAIM_LINK");
}
const key = text;
const anyData = z.object({ notes: text, references: texts });
export const technicalSchema = z.object({
  architecture: text,
  data_model: z
    .array(
      z.object({
        name: text,
        fields: z.array(
          z.object({
            name: text,
            type: text,
            required: z.boolean(),
            description: text,
          }),
        ),
        relationships: texts,
        persistence: text,
        retention: text,
        sensitivity: text,
      }),
    )
    .min(1),
  integrations: z.array(
    z.object({
      name: text,
      purpose: text,
      provider: text,
      alternatives: texts,
      auth: text,
      boundary: text,
      failure_retry: text,
      limits: text,
      platform_configuration: text,
      privacy: text,
      test_strategy: text,
    }),
  ),
  analytics: text,
  security: text,
  platform_notes: text,
  design: text,
  monetization: text,
  aso: text,
  launch_validation: text,
});
export const blueprintSchema = z.object({
  technical: technicalSchema.optional(),
  product: z.object({
    name: text,
    mission: text,
    audience: text,
    wedge: text,
    scope: texts,
    non_goals: texts,
    monetization: text,
    architecture: text,
    security: text,
    analytics: text,
    launch: text,
  }),
  requirements: z
    .array(
      z.object({
        stable_key: key,
        title: text,
        requirement_text: text,
        rationale: text,
        priority: text,
        acceptance_criteria: texts,
        trace: anyData,
      }),
    )
    .min(1),
  features: z
    .array(
      z.object({
        stable_key: key,
        name: text,
        outcome: text,
        description: text,
        priority: text,
        data: anyData,
      }),
    )
    .min(1),
  rules: z
    .array(
      z.object({
        stable_key: key,
        name: text,
        condition_text: text,
        behavior_text: text,
        exceptions: texts,
        data: anyData,
      }),
    )
    .min(1),
  screens: z
    .array(
      z.object({
        stable_key: key,
        name: text,
        purpose: text,
        entry_points: texts,
        components: z.array(
          z.object({
            type: z.enum([
              "heading",
              "text",
              "button",
              "input",
              "card",
              "list",
            ]),
            text,
            target: z.string().nullable(),
          }),
        ),
        states: z.object({
          default: text,
          loading: text,
          empty: text,
          error: text,
          offline: text,
          permission: text,
          partial: text,
        }),
        actions: texts,
        navigation: texts,
        data: anyData,
      }),
    )
    .min(2),
  flows: z
    .array(
      z.object({
        stable_key: key,
        name: text,
        trigger_text: text,
        preconditions: texts,
        steps: texts,
        completion_text: text,
        data: anyData,
      }),
    )
    .min(1),
  decisions: z
    .array(
      z.object({
        stable_key: key,
        decision_text: text,
        rationale: text,
        alternatives: texts,
        consequences: texts,
        research_trace: anyData,
      }),
    )
    .min(1),
  tasks: z
    .array(
      z.object({
        stable_key: key,
        title: text,
        objective: text,
        dependencies: texts,
        implements: texts,
        guidance: text,
        test_obligations: texts,
        definition_of_done: texts,
        sequence: z.number().int().min(0),
      }),
    )
    .min(1),
  tests: z
    .array(
      z.object({
        stable_key: key,
        title: text,
        test_type: text,
        validates: texts,
        steps: texts,
        expected_result: text,
      }),
    )
    .min(1),
  links: z
    .array(
      z.object({
        source_kind: text,
        source_key: key,
        target_kind: text,
        target_key: key,
        relation: z.enum(blueprintRelations),
      }),
    )
    .min(1),
});
export type Blueprint = z.infer<typeof blueprintSchema>;
export const consistencySchema = z.object({
  summary: text,
  findings: z.array(
    z.object({
      severity: z.enum(["critical", "major", "minor"]),
      artifact_key: text,
      issue: text,
      fix: text,
    }),
  ),
});
export function reviewedQuality(
  b: Bundle,
  review: z.infer<typeof consistencySchema> | null,
) {
  const report = quality(b);
  const pass =
    !!review &&
    !review.findings.some((f) => ["critical", "major"].includes(f.severity));
  const gate = {
    id: "CONSISTENCY",
    name: "Independent consistency review",
    pass,
    reason: review?.summary || "An independent AI review is pending.",
  };
  return {
    ...report,
    mandatory_pass: report.mandatory_pass && pass,
    gates: [...report.gates, gate],
    findings: [...report.findings, ...(pass ? [] : [gate])],
    overall_score: Math.round(
      ((report.gates.filter((g) => g.pass).length + Number(pass)) / 14) * 100,
    ),
  };
}
export type Bundle = Blueprint & {
  documents: { path: string; title: string; content_md: string }[];
  prototype: {
    screens: Blueprint["screens"];
    flows: Blueprint["flows"];
    tokens: Record<string, string>;
  };
};
export function documentBundle(b: Blueprint, research: unknown): Bundle {
  const md = (title: string, data: unknown) =>
    "# " +
    title +
    "\n\n" +
    (typeof data === "string"
      ? data
      : Array.isArray(data)
        ? data
            .map((x) =>
              typeof x === "string"
                ? "- " + x
                : "## " +
                  (x.stable_key || "") +
                  " " +
                  (x.title || x.name || "") +
                  "\n\n" +
                  Object.entries(x)
                    .filter(
                      ([k]) => !["stable_key", "title", "name"].includes(k),
                    )
                    .map(
                      ([k, v]) =>
                        "**" +
                        k.replaceAll("_", " ") +
                        "**\n\n" +
                        (typeof v === "string"
                          ? v
                          : "```json\n" + JSON.stringify(v, null, 2) + "\n```"),
                    )
                    .join("\n\n"),
            )
            .join("\n\n")
        : "```json\n" + JSON.stringify(data, null, 2) + "\n```");
  const files: Record<string, unknown> = {
    "README.md": b.product.mission,
    "AGENTS.md":
      "Read product/PRD.md, ux/SCREENS.md and execution/TASKS.md first. Implement only specified behavior. Flutter for Android and iOS. Preserve stable IDs and all error states. Validate every task. Documents and prototypes are specifications; this package does not contain production code.",
    "product/PRODUCT.md": b.product,
    "product/PRD.md": b.requirements,
    "product/FEATURES.md": b.features,
    "product/REQUIREMENTS.md": b.requirements,
    "product/BUSINESS_RULES.md": b.rules,
    "product/DECISIONS.md": b.decisions,
    "ux/DESIGN.md": {
      font: "Cairo",
      spacing: [4, 8, 12, 16, 24, 32],
      themes: ["light", "dark"],
      principles:
        "Accessible mobile-first layouts. Platform-adaptive Flutter widgets.",
    },
    "ux/INFORMATION_ARCHITECTURE.md": b.screens.map((s) => ({
      screen: s.stable_key,
      name: s.name,
      navigation: s.navigation,
    })),
    "ux/USER_FLOWS.md": b.flows,
    "ux/SCREENS.md": b.screens,
    "ux/COMPONENTS.md": b.screens.flatMap((s) => s.components),
    "ux/ACCESSIBILITY.md":
      "Keyboard/focus and screen reader labels, scalable text, sufficient contrast, reduced motion, 48dp touch targets. Test all screens with TalkBack and VoiceOver.",
    "technical/ARCHITECTURE.md": b.product.architecture,
    "technical/DATA_MODEL.md": b.features.map((f) => ({
      feature: f.name,
      data: f.data,
    })),
    "technical/INTEGRATIONS.md": b.product.architecture,
    "technical/SECURITY.md": b.product.security,
    "technical/ANALYTICS.md": b.product.analytics,
    "technical/PLATFORM_NOTES.md":
      "Flutter / Dart. Target Android and iOS. Document platform permissions, offline states, deep links and release signing before implementation.",
    "business/MONETIZATION.md": b.product.monetization,
    "business/ASO.md": b.product.launch,
    "business/LAUNCH_VALIDATION.md": b.product.launch,
    "research/MARKET.md": research,
    "research/COMPETITORS.md": research,
    "research/USER_VOICE.md": research,
    "research/EVIDENCE_SUMMARY.md": research,
    "research/TRACEABILITY.md": b.links,
    "execution/ROADMAP.md": b.tasks.map((t) => ({
      task: t.stable_key,
      title: t.title,
      dependencies: t.dependencies,
    })),
    "execution/TASKS.md": b.tasks,
    "execution/TESTING.md": b.tests,
    "execution/DEFINITION_OF_DONE.md":
      "All acceptance criteria and traced tests pass. All defined screen states work. No unresolved critical security issues. Android and iOS validated. Product scope remains as approved.",
  };
  const r = research as Record<string, any>;
  const recs = r?.recommendations || [];
  const scores = r?.scores || [];
  files["product/PRODUCT.md"] = {
    ...b.product,
    problem: r?.concept?.mvp_thesis,
    source_idea: r?.concept?.id,
    principles: [
      "Evidence-backed claims retain provenance.",
      "Scope is defined by requirements and decisions.",
    ],
    success_criteria: b.requirements.flatMap((x) => x.acceptance_criteria),
  };
  files["product/PRD.md"] = {
    scope: b.product.scope,
    audience: b.product.audience,
    non_goals: b.product.non_goals,
    requirements: b.requirements,
    assumptions: b.decisions.filter((d) => d.research_trace.notes),
  };
  files["research/MARKET.md"] = {
    concept: r?.concept,
    recommendations: recs.map((x: any) => ({
      status: x.status,
      rationale: x.rationale,
      validation_priorities: x.validation_priorities,
    })),
    scores: scores.map((x: any) => ({
      score: x.overall_score,
      factors: x.factors,
      market_id: x.market_id,
    })),
    note: "Scores are qualitative assessments. Revenue, downloads and uncollected metrics remain unknown.",
  };
  files["research/COMPETITORS.md"] = scores.flatMap(
    (x: any) => x.factors?.analysis?.competitors || [],
  );
  files["research/USER_VOICE.md"] = {
    clusters: scores.flatMap(
      (x: any) => x.factors?.analysis?.review_clusters || [],
    ),
    limitations:
      "Only collected reviews support user-voice claims. Empty samples mean unknown; store rating counts are not analyzed review samples.",
  };
  files["research/EVIDENCE_SUMMARY.md"] = (r?.evidence || []).map((e: any) => ({
    id: e.id,
    title: e.title,
    url: e.canonical_url,
    collected_at: e.collected_at,
    published_at: e.published_at,
    source_type: e.source_type,
    text: e.normalized_text,
  }));
  files["prototype/README.md"] =
    "prototype.json is the canonical screen and flow model for this version. Import figma-handoff.json using the companion H93Lab Figma plugin to create editable Auto Layout frames. This preview validates information architecture and behavior; it is not production Flutter code.";
  if (b.technical) {
    const t = b.technical;
    Object.assign(files, {
      "technical/ARCHITECTURE.md": t.architecture,
      "technical/DATA_MODEL.md": t.data_model,
      "technical/INTEGRATIONS.md": t.integrations.length
        ? t.integrations
        : "No external integration is required in this version.",
      "technical/SECURITY.md": t.security,
      "technical/ANALYTICS.md": t.analytics,
      "technical/PLATFORM_NOTES.md": t.platform_notes,
      "ux/DESIGN.md": t.design,
      "business/MONETIZATION.md": t.monetization,
      "business/ASO.md": t.aso,
      "business/LAUNCH_VALIDATION.md": t.launch_validation,
    });
  }
  for (const agent of ["CLAUDE", "CODEX", "KIMI", "GEMINI"])
    files[agent + ".md"] =
      "Follow AGENTS.md and the canonical product, UX, technical, and execution documents. Do not duplicate or override their requirements.";
  return {
    ...b,
    documents: Object.entries(files).map(([path, data]) => ({
      path,
      title: path.split("/").pop()!.replace(".md", "").replaceAll("_", " "),
      content_md: md(path, data),
    })),
    prototype: {
      screens: b.screens,
      flows: b.flows,
      tokens: { primary: "#111827", background: "#ffffff", font: "Cairo" },
    },
  };
}
export function quality(b: Bundle) {
  const graph = blueprintGraph(b);
  const entities = [
    ...b.requirements,
    ...b.features,
    ...b.rules,
    ...b.screens,
    ...b.flows,
    ...b.decisions,
    ...b.tasks,
    ...b.tests,
  ];
  const keys = new Set(entities.map((e) => e.stable_key));
  const refs =
    graph.refs &&
    b.links.every((l) => keys.has(l.source_key) && keys.has(l.target_key));
  const visited = new Set<string>(),
    visiting = new Set<string>();
  let cycle = false;
  const visit = (key: string) => {
    if (visiting.has(key)) {
      cycle = true;
      return;
    }
    if (visited.has(key)) return;
    visiting.add(key);
    b.tasks.find((t) => t.stable_key === key)?.dependencies.forEach(visit);
    visiting.delete(key);
    visited.add(key);
  };
  b.tasks.forEach((t) => visit(t.stable_key));
  const screenKeys = new Set(b.screens.map((s) => s.stable_key));
  const checks: [string, boolean, string][] = [
    [
      "Product coverage",
      graph.product,
      "Every requirement needs acceptance criteria and an implementation feature/task.",
    ],
    [
      "Scope integrity",
      graph.scope,
      "Every feature must connect to an accepted requirement.",
    ],
    [
      "UX coverage",
      graph.ux,
      "Every visible feature needs a screen/flow; every screen needs a feature/flow purpose. Headless features explicitly start data.notes with Headless:.",
    ],
    [
      "Screen states",
      b.screens.every((s) =>
        (["default", "loading", "empty", "error", "offline"] as const).every(
          (k) => !!s.states[k],
        ),
      ),
      "Define default, loading, empty, error and offline states.",
    ],
    [
      "Navigation integrity",
      graph.navigation &&
        b.screens.every(
          (s) =>
            s.navigation.every((n) => screenKeys.has(n)) &&
            s.components.every(
              (c) => c.target === null || screenKeys.has(c.target),
            ),
        ) &&
        b.flows.every((f) => f.steps.every((s) => screenKeys.has(s))),
      "Every screen is reachable, every flow transition is executable, and every target exists.",
    ],
    [
      "Business rule coverage",
      b.rules.every((r) =>
        b.tests.some((t) => t.validates.includes(r.stable_key)),
      ),
      "Critical rules must have tests.",
    ],
    [
      "Data and integrations",
      b.product.architecture.length > 100,
      "Architecture must cover data and integrations.",
    ],
    [
      "Security and privacy",
      b.product.security.length > 100,
      "Security plan must be substantive.",
    ],
    [
      "Analytics coverage",
      b.product.analytics.length > 60,
      "Define analytics events and privacy.",
    ],
    [
      "Test traceability",
      !cycle &&
        b.tests.every(
          (t) =>
            t.validates.length > 0 && t.validates.every((k) => keys.has(k)),
        ) &&
        b.requirements.every((r) =>
          b.tests.some((t) => t.validates.includes(r.stable_key)),
        ) &&
        b.tasks.every(
          (t) =>
            t.implements.length > 0 &&
            t.implements.every((k) => keys.has(k)) &&
            t.dependencies.every((k) =>
              b.tasks.some((x) => x.stable_key === k),
            ),
        ),
      "Each requirement has a test; references are valid and task dependencies are acyclic.",
    ],
    [
      "Research traceability",
      b.decisions.every((d) => Object.keys(d.research_trace).length > 0) &&
        refs,
      "Decisions must carry a research or explicit judgment trace.",
    ],
    [
      "Prototype consistency",
      JSON.stringify(b.prototype.screens) === JSON.stringify(b.screens) &&
        JSON.stringify(b.prototype.flows) === JSON.stringify(b.flows),
      "Prototype screens and flows must exactly match the current blueprint.",
    ],
    [
      "Agent handoff",
      keys.size === entities.length && b.documents.length >= 30,
      "No duplicate stable IDs or missing export documents.",
    ],
  ];
  const gates = checks.map(([name, pass, reason], i) => ({
    id: "QG-" + String(i + 1).padStart(2, "0"),
    name,
    pass,
    reason,
  }));
  return {
    mandatory_pass: gates.every((g) => g.pass),
    overall_score: Math.round((gates.filter((g) => g.pass).length / 13) * 100),
    gates,
    findings: gates.filter((g) => !g.pass),
  };
}
export function assertEvidence(ids: string[], allowed: Set<string>) {
  if (!ids.length || ids.some((id) => !allowed.has(id)))
    throw new Error("UNSUPPORTED_EVIDENCE_REFERENCE");
}
export function safePath(path: string) {
  if (
    !/^[A-Za-z0-9_./-]+$/.test(path) ||
    path.startsWith("/") ||
    path.split("/").includes("..")
  )
    throw new Error("UNSAFE_EXPORT_PATH");
  return path;
}
