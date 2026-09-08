import { z } from "zod";
import type { Store, Row } from "./store.ts";
import { stableId } from "./domain.ts";

const optionalText = z.string().max(120).optional();
export const decisionFilterSchema = z
  .object({
    q: optionalText,
    market: z
      .string()
      .regex(/^[A-Z]{2,8}$/)
      .optional(),
    category: z.string().uuid().optional(),
    kind: z.enum(["app", "game"]).optional(),
    opportunity_type: optionalText,
    recommendation: z
      .enum([
        "STRONG_BUILD",
        "BUILD",
        "VALIDATE_FIRST",
        "WATCH",
        "PASS",
        "KILLED",
      ])
      .optional(),
    disposition: z
      .enum([
        "undecided",
        "shortlisted",
        "watching",
        "passed",
        "archived",
        "go",
      ])
      .optional(),
    min_score: z.coerce.number().min(0).max(100).optional(),
    min_confidence: z.coerce.number().min(0).max(100).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    sort: z.enum(["score", "confidence", "title", "recent"]).default("score"),
    page: z.coerce.number().int().min(0).max(10000).default(0),
  })
  .strict();

export async function decisionList(s: Store, url: URL) {
  const raw = Object.fromEntries(
    [...url.searchParams].filter(([, v]) => v !== ""),
  );
  const filter = decisionFilterSchema.parse(raw);
  if (filter.from && filter.to && filter.from > filter.to)
    throw Error("INVALID_DATE_RANGE");
  return s.rpc("center_decision_list", { p_owner: s.owner, p_filter: filter });
}

export async function compareIdeas(s: Store, raw: string[] | string) {
  const ids = z
    .array(z.string().uuid())
    .min(2)
    .max(3)
    .parse(typeof raw === "string" ? raw.split(",") : raw);
  if (new Set(ids).size !== ids.length) throw Error("DISTINCT_IDEAS_REQUIRED");
  const result = await s.rpc("center_decision_list", {
    p_owner: s.owner,
    p_filter: { ids },
  });
  if (result.items.length !== ids.length) throw Error("NOT_FOUND");
  const items = ids.map((id) => result.items.find((r: Row) => r.id === id));
  const signatures = new Set(
    items.map((r: Row) =>
      [
        r.market_code,
        r.scoring_model_id,
        r.factors?.rubric_version || "1.0",
      ].join(":"),
    ),
  );
  return {
    items,
    comparable:
      signatures.size === 1 &&
      items.every((r: Row) => r.score_snapshot_id && r.confidence_snapshot_id),
    notes: [
      "Compare like markets, scoring models and collection periods. Dates remain visible; a newer sample may change the conclusion.",
      ...(signatures.size > 1
        ? [
            "These ideas use different markets, scoring models or factor rubrics; their numeric ranks are not directly comparable.",
          ]
        : []),
    ],
  };
}

async function ownedRows(s: Store, table: string, ids: string[]) {
  if (!ids.length) return [] as Row[];
  const { data, error } = await s.db
    .from(table)
    .select("*")
    .eq("owner_id", s.owner)
    .in("id", [...new Set(ids)]);
  if (error) throw error;
  return (data || []) as Row[];
}
export function pairedMarkets(
  recommendations: Row[],
  scores: Row[],
  confidence: Row[],
  markets: Row[],
  models: Row[],
) {
  const latest = new Map<string, Row>();
  for (const rec of [...recommendations].sort(
    (a, b) =>
      b.created_at.localeCompare(a.created_at) || b.id.localeCompare(a.id),
  ))
    if (!latest.has(rec.market_id || "unknown"))
      latest.set(rec.market_id || "unknown", rec);
  return [...latest.values()].map((rec) => {
    const score = scores.find(
      (s) => s.id === rec.score_snapshot_id && s.concept_id === rec.concept_id,
    );
    const conf = confidence.find(
      (s) =>
        s.id === rec.confidence_snapshot_id && s.concept_id === rec.concept_id,
    );
    return {
      recommendation: rec,
      score: score || null,
      confidence: conf || null,
      market: markets.find((m) => m.id === rec.market_id) || {
        code: "UNKNOWN",
        name: "Unconfirmed market",
      },
      model: models.find((m) => m.id === score?.scoring_model_id) || null,
    };
  });
}
export function snapshotChanges(snapshots: Row[], evidence: Row[]) {
  const sorted = [...snapshots].sort((a, b) =>
    b.captured_at.localeCompare(a.captured_at),
  );
  if (sorted.length < 2) return [];
  const now = sorted[0];
  const currentEvidence = evidence.find((e) => e.id === now.evidence_id);
  const before = sorted
    .slice(1)
    .find(
      (x) =>
        x.platform === now.platform &&
        x.market_id === now.market_id &&
        evidence.find((e) => e.id === x.evidence_id)?.parser_version ===
          currentEvidence?.parser_version,
    );
  if (!before || !now.evidence_id || !before.evidence_id || !currentEvidence)
    return [];
  return [
    "price_summary",
    "rating",
    "review_count",
    "version",
    "features",
    "languages",
  ].flatMap((field) => {
    if (
      now[field] == null ||
      before[field] == null ||
      JSON.stringify(now[field]) === JSON.stringify(before[field])
    )
      return [];
    return [
      {
        field,
        before: before[field],
        after: now[field],
        before_at: before.captured_at,
        after_at: now.captured_at,
        before_source:
          evidence.find((e) => e.id === before.evidence_id)?.canonical_url ||
          null,
        after_source: currentEvidence.canonical_url,
        market_id: now.market_id,
        platform: now.platform,
      },
    ];
  });
}
export async function decisionDetail(s: Store, id: string) {
  await s.one("product_concepts", z.string().uuid().parse(id));
  const [recommendations, scores, confidence, links, relations, validations] =
    await Promise.all([
      s.all("recommendations", { concept_id: id }, "created_at"),
      s.all("score_snapshots", { concept_id: id }, "calculated_at"),
      s.all("confidence_snapshots", { concept_id: id }, "calculated_at"),
      s.list("concept_evidence", { concept_id: id }, 1000),
      s.list("concept_competitors", { concept_id: id }, 100),
      validationList(s, id),
    ]);
  const competitorIds = relations.map((r) => r.competitor_id);
  const competitors = await ownedRows(s, "competitors", competitorIds);
  const snapQuery = competitorIds.length
    ? await s.db
        .from("competitor_snapshots")
        .select("*")
        .eq("owner_id", s.owner)
        .in("competitor_id", competitorIds)
        .order("captured_at", { ascending: false })
        .limit(500)
    : { data: [], error: null };
  if (snapQuery.error) throw snapQuery.error;
  const snapshots = snapQuery.data || [];
  const evidenceIds = [
    ...new Set([
      ...recommendations.flatMap((r) => r.strongest_evidence_ids || []),
      ...links.map((r) => r.evidence_id),
      ...snapshots.map((r) => r.evidence_id).filter(Boolean),
    ]),
  ] as string[];
  const evidence = await ownedRows(s, "evidence", evidenceIds);
  const claimLinks = evidenceIds.length
    ? await s.db
        .from("claim_evidence")
        .select("*")
        .eq("owner_id", s.owner)
        .in("evidence_id", evidenceIds)
        .limit(1000)
    : { data: [], error: null };
  if (claimLinks.error) throw claimLinks.error;
  const claims = await ownedRows(
    s,
    "claims",
    (claimLinks.data || []).map((r) => r.claim_id),
  );
  const allClaimLinks = claims.length
    ? await s.db
        .from("claim_evidence")
        .select("*")
        .eq("owner_id", s.owner)
        .in(
          "claim_id",
          claims.map((c) => c.id),
        )
        .limit(2000)
    : { data: [], error: null };
  if (allClaimLinks.error) throw allClaimLinks.error;
  const extraEvidence = await ownedRows(
    s,
    "evidence",
    (allClaimLinks.data || [])
      .map((l) => l.evidence_id)
      .filter((x) => !evidenceIds.includes(x)),
  );
  evidence.push(...extraEvidence);
  const catalog = await s.db.from("markets").select("*");
  if (catalog.error) throw catalog.error;
  const models = await ownedRows(
    s,
    "scoring_models",
    scores.map((r) => r.scoring_model_id),
  );
  const markets = pairedMarkets(
    recommendations,
    scores,
    confidence,
    catalog.data || [],
    models,
  );
  const current = [...recommendations].sort((a, b) =>
    b.created_at.localeCompare(a.created_at),
  )[0];
  return {
    markets,
    evidence,
    validations,
    claims: claims.map((c) => ({
      ...c,
      links: (allClaimLinks.data || [])
        .filter((l) => l.claim_id === c.id)
        .map((l) => ({
          ...l,
          evidence: evidence.find((e) => e.id === l.evidence_id),
        })),
    })),
    coverage: evidence.map((e) => ({
      id: e.id,
      title: e.title,
      source_url: e.canonical_url,
      source_type: e.source_type,
      observed_market: e.observed_market_code || "Unknown",
      requested_market:
        catalog.data?.find((m) => m.id === e.requested_market_id)?.code ||
        "Unknown",
      language:
        e.language === "und"
          ? "Unknown"
          : e.parser_version === "1.0"
            ? "Unconfirmed legacy label"
            : e.language || "Unknown",
      note:
        e.raw_payload?.provenance?.coverage_note ||
        "Legacy evidence: source coverage has not been independently confirmed.",
      origin:
        e.raw_payload?.provenance?.verification_origin || "source_collection",
      collected_at: e.collected_at,
    })),
    matrix: competitors.map((c) => {
      const history = snapshots.filter((x) => x.competitor_id === c.id);
      const latest = history[0] || null;
      return {
        ...c,
        relation: relations.find((r) => r.competitor_id === c.id),
        latest,
        source: evidence.find((e) => e.id === latest?.evidence_id) || null,
        market: catalog.data?.find((m) => m.id === latest?.market_id) || null,
        changes: snapshotChanges(history, evidence),
      };
    }),
    next_step: current?.validation_priorities?.[0]
      ? {
          question: current.validation_priorities[0],
          method:
            "Run focused research for this concept or record a sourced manual validation.",
          success_criterion:
            "Define the observation that would support or reject this assumption before testing.",
          estimated_hours: null,
          estimated_cost_usd: null,
        }
      : null,
  };
}

export const validationSchema = z
  .object({
    request_key: z.string().uuid(),
    question: z.string().trim().min(1).max(500),
    method: z.string().trim().min(1).max(1000),
    success_criterion: z.string().trim().min(1).max(1000),
    estimated_hours: z.number().min(0).max(1000),
    estimated_cost_usd: z.number().min(0).max(100000),
    outcome: z.enum(["planned", "supported", "rejected", "inconclusive"]),
    result: z.string().max(4000).default(""),
    evidence_ids: z.array(z.string().uuid()).max(100).default([]),
    observed_at: z.iso.datetime(),
  })
  .strict()
  .refine(
    (v) =>
      v.outcome === "planned" ||
      (v.result.trim().length > 0 && v.evidence_ids.length > 0),
    "Completed validation requires a result and evidence",
  );
export async function validationList(s: Store, id: string) {
  await s.one("product_concepts", id);
  const { data, error } = await s.db
    .from("validation_records")
    .select("*")
    .eq("owner_id", s.owner)
    .eq("concept_id", id)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
}
export async function saveValidation(s: Store, id: string, raw: unknown) {
  await s.one("product_concepts", z.string().uuid().parse(id));
  const input = validationSchema.parse(raw);
  if (Date.parse(input.observed_at) > Date.now() + 300000)
    throw Error("FUTURE_OBSERVATION");
  const evidence = await ownedRows(s, "evidence", input.evidence_ids);
  if (evidence.length !== new Set(input.evidence_ids).size)
    throw Error("INVALID_EVIDENCE_REFERENCE");
  const row = {
    id: await stableId(s.owner + ":validation:" + input.request_key),
    concept_id: id,
    ...input,
    owner_id: s.owner,
  };
  const inserted = await s.db.from("validation_records").upsert(row, {
    onConflict: "owner_id,request_key",
    ignoreDuplicates: true,
  });
  if (inserted.error) throw inserted.error;
  const record = (
    await s.list("validation_records", { request_key: input.request_key }, 1)
  )[0];
  if (
    !record ||
    record.concept_id !== id ||
    Object.keys(input).some((key) =>
      key === "observed_at"
        ? Date.parse(record[key]) !== Date.parse(input.observed_at)
        : JSON.stringify(record[key]) !== JSON.stringify((input as Row)[key]),
    )
  )
    throw Error("REQUEST_KEY_CONFLICT");
  for (const e of evidence)
    await s.put(
      "concept_evidence",
      { concept_id: id, evidence_id: e.id, origin: "validation" },
      "concept_id,evidence_id",
    );
  return record;
}
