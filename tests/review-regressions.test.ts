import { test } from "node:test";
import assert from "node:assert/strict";
import { unzipSync } from "fflate";
import { callReservation } from "../supabase/functions/_shared/ai.ts";
import {
  providerHttpError,
  retryable,
  retryDelay,
} from "../supabase/functions/_shared/job-errors.ts";
import { buildExportPackage } from "../supabase/functions/_shared/export-package.ts";
import {
  parseCsv,
  parseReviewImport,
  previewReviewImport,
} from "../supabase/functions/_shared/source-import.ts";
import {
  analysisSchema,
  killRules,
  validateAnalysisEvidence,
  quality,
  validateClaimLinks,
} from "../supabase/functions/_shared/domain.ts";
import {
  pairedMarkets,
  snapshotChanges,
} from "../supabase/functions/_shared/decision.ts";
import { fixture } from "./fixtures.ts";
const eid = crypto.randomUUID();
const assessment = () => ({
  market_code: "US",
  factors: { demand: { value: 50, rationale: "Unknown", evidence_ids: [] } },
  confidence: {
    quality: 50,
    diversity: 50,
    recency: 50,
    agreement: 50,
    coverage: 50,
    specificity: 50,
  },
  critical_unknowns: ["Unknown dependencies"],
  risks: killRules.map((rule) => ({
    rule,
    result: "unknown" as const,
    severity: "hard" as const,
    rationale: "No supporting evidence yet",
    evidence_ids: [] as string[],
  })),
  competitors: [],
  review_clusters: [],
  gap: "Unknown",
  monetization: "Unknown",
  distribution: "Unknown",
  executive_brief: "Needs validation",
  validation_priorities: ["Validate demand"],
});
test("zero budgets remain zero while verified free models can reserve zero", () => {
  assert.throws(
    () => callReservation(100, 100, { prompt: 0.001, completion: 0.001 }, 0),
    /CALL_BUDGET_LIMIT/,
  );
  assert.equal(
    callReservation(100, 100, { prompt: "0", completion: "0" }, 0),
    0,
  );
  assert.throws(() =>
    callReservation(100, 100, { prompt: null, completion: 0 }, 1),
  );
});
test("429 and timeout retries are classified with bounded Retry-After", () => {
  const e = providerHttpError(429, "180");
  assert.ok(retryable(e));
  assert.equal(
    retryDelay(1, e, () => 0),
    180,
  );
  assert.ok(!retryable(providerHttpError(401)));
  assert.ok(retryable(new DOMException("Timed out", "TimeoutError")));
  assert.ok(retryDelay(20, providerHttpError(429, "999999"), () => 1) <= 3600);
});
test("every hard kill rule is required and unknown evidence stays explicitly unknown", () => {
  const a = assessment();
  validateAnalysisEvidence(a, []);
  assert.equal(analysisSchema.safeParse({ ...a, risks: [] }).success, false);
  const repeated = assessment();
  repeated.risks[1] = repeated.risks[0];
  assert.throws(
    () => validateAnalysisEvidence(repeated, []),
    /INCOMPLETE_KILL/,
  );
  const invalid = {
    ...assessment(),
    review_clusters: [
      {
        theme: "Test",
        category: "ux",
        sentiment: "negative",
        sample_size: 1,
        member_count: 1,
        summary: "Fixture review",
        evidence_ids: [eid],
      },
    ],
  };
  assert.throws(
    () =>
      validateAnalysisEvidence(invalid, [
        { id: eid, source_type: "official_store" },
      ]),
    /INVALID_REVIEW_EVIDENCE/,
  );
});
test("claim relations preserve contradictions and reject invented or duplicate links", () => {
  const c = {
    evidence_ids: [eid],
    evidence_links: [
      {
        evidence_id: eid,
        relation: "contradicts",
        strength: 70,
        rationale: "Conflicting observation",
      },
    ],
  } as any;
  validateClaimLinks(c, new Set([eid]));
  assert.throws(() => validateClaimLinks(c, new Set()), /UNSUPPORTED/);
  assert.throws(
    () =>
      validateClaimLinks(
        { ...c, evidence_links: [...c.evidence_links, ...c.evidence_links] },
        new Set([eid]),
      ),
    /DUPLICATE/,
  );
});
test("quality blocks self-links, unimplemented features and disconnected navigation", () => {
  let b = fixture();
  b.links[0] = {
    source_kind: "feature",
    source_key: "FEAT-001",
    target_kind: "feature",
    target_key: "FEAT-001",
    relation: "implements",
  };
  assert.equal(quality(b).mandatory_pass, false);
  b = fixture();
  b.screens[0].navigation = [];
  b.screens[0].components[0].target = null;
  assert.equal(quality(b).mandatory_pass, false);
});
test("export validates every payload and blocks broken paths, missing documents and secrets", async () => {
  const p = { id: crypto.randomUUID(), name: "Fixture", slug: "fixture" };
  const v = {
    id: crypto.randomUUID(),
    version_number: 1,
    manifest: fixture(),
    consistency_review: { summary: "Fixture", findings: [] },
  };
  const result = await buildExportPackage(p, v);
  assert.ok(unzipSync(result.archive)["MANIFEST.json"]);
  const secret = "sk-or-v1-" + "test".repeat(16);
  const b = fixture();
  b.prototype.tokens.secret = secret;
  await assert.rejects(
    buildExportPackage(p, { ...v, manifest: b }),
    /EXPORT_SECRET/,
  );
  await assert.rejects(
    buildExportPackage({ ...p, name: secret }, v),
    /EXPORT_SECRET/,
  );
  const link = fixture();
  link.documents[0].content_md += "\n[Broken](missing.md)";
  await assert.rejects(
    buildExportPackage(p, { ...v, manifest: link }),
    /EXPORT_BROKEN_LINK/,
  );
  const missing = fixture();
  missing.documents = missing.documents.filter((d) => d.path !== "AGENTS.md");
  await assert.rejects(
    buildExportPackage(p, { ...v, manifest: missing }),
    /REQUIRED_FILE/,
  );
  const duplicate = fixture();
  duplicate.documents.push(duplicate.documents[0]);
  await assert.rejects(
    buildExportPackage(p, { ...v, manifest: duplicate }),
    /DUPLICATE_PATH/,
  );
});
export function importFixture() {
  return {
    format: "json",
    content: JSON.stringify([
      {
        external_id: "fixture-1",
        text: "Fixture review used only in isolated test owner",
        published_at: "2026-09-01T00:00:00Z",
        url: "https://example.com/reviews/1",
        app_id: "fixture-app",
        rating: 3,
      },
    ]),
    source_name: "Isolated test fixture",
    source_url: "https://example.com/reviews",
    market: "US",
    platform: "ios",
    language: "en",
    sampled_at: "2026-09-02T00:00:00Z",
    confirmed_real_reviews: true,
    dataset_kind: "real",
  };
}
test("review import parses quoted multiline CSV, deduplicates, and enforces provenance", () => {
  const csv =
    'external_id,text,published_at,url,app_id\r\n1,"A quote ""here""\nand line",2026-09-01T00:00:00Z,https://example.com/r,app';
  assert.equal(parseCsv(csv)[0].text, 'A quote "here"\nand line');
  const f = importFixture();
  assert.equal(previewReviewImport(f).count, 1);
  assert.throws(() =>
    parseReviewImport({ ...f, confirmed_real_reviews: false }),
  );
  assert.throws(
    () => parseReviewImport({ ...f, sampled_at: "2099-01-01T00:00:00Z" }),
    /FUTURE/,
  );
  assert.throws(() => parseCsv("external_id,external_id\n1,2"), /HEADERS/);
});
test("market comparison pairs linked snapshots and changes need comparable observations", () => {
  const rec = {
    id: "r",
    concept_id: "c",
    created_at: "2026-01-02",
    market_id: "us",
    score_snapshot_id: "s1",
    confidence_snapshot_id: "c1",
  };
  const m = pairedMarkets(
    [rec],
    [
      { id: "s2", concept_id: "c", overall_score: 100 },
      { id: "s1", concept_id: "c", overall_score: 20 },
    ],
    [{ id: "c1", concept_id: "c", confidence: 30 }],
    [{ id: "us", code: "US" }],
    [],
  );
  assert.equal(m[0].score?.overall_score, 20);
  assert.equal(m[0].confidence?.confidence, 30);
  assert.deepEqual(
    snapshotChanges(
      [
        {
          captured_at: "2026-02-01",
          evidence_id: "e2",
          market_id: "US",
          platform: "ios",
          rating: 4,
        },
        {
          captured_at: "2026-01-01",
          evidence_id: "e1",
          market_id: "GB",
          platform: "ios",
          rating: 2,
        },
      ],
      [
        { id: "e1", parser_version: "1" },
        { id: "e2", parser_version: "1" },
      ],
    ),
    [],
  );
});
test("structured risk contract cannot emit pass or fail without a reference", () => {
  const a = assessment();
  const missing = {
    ...a,
    risks: a.risks.map((r, i) => (i ? r : { ...r, result: "pass" })),
  };
  assert.equal(analysisSchema.safeParse(missing).success, false);
  assert.equal(analysisSchema.safeParse(a).success, true);
});
test("contradiction links do not satisfy feature implementation coverage", () => {
  const b = fixture();
  b.links[0].relation = "contradicts";
  assert.equal(quality(b).mandatory_pass, false);
});
