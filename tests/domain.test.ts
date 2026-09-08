import { test } from "node:test";
import assert from "node:assert/strict";
import {
  weighted,
  appWeights,
  gameWeights,
  confidenceWeights,
  recommend,
  quality,
  reviewedQuality,
  safePath,
  stableId,
  localDate,
  scheduleDue,
  assertEvidence,
} from "../supabase/functions/_shared/domain.ts";
import { fixture } from "./fixtures.ts";
test("APP/GAME/confidence weights are normalized and reject missing factors", () => {
  for (const weights of [appWeights, gameWeights, confidenceWeights]) {
    assert.equal(
      weighted(
        Object.fromEntries(Object.keys(weights).map((k) => [k, 80])),
        weights,
      ),
      80,
    );
    assert.throws(() => weighted({}, weights));
  }
  assert.throws(() => weighted({ x: 101 }, { x: 100 }));
});
test("kill override, uncertain confidence and threshold boundaries", () => {
  assert.equal(recommend(100, 100, true), "KILLED");
  assert.equal(
    recommend(90, 90, false, ["Critical unknown"]),
    "VALIDATE_FIRST",
  );
  assert.equal(recommend(85, 75, false), "STRONG_BUILD");
  assert.equal(recommend(75, 65, false), "BUILD");
  assert.equal(recommend(75, 64, false), "VALIDATE_FIRST");
  assert.equal(recommend(60, 90, false), "WATCH");
  assert.equal(recommend(59.99, 100, false), "PASS");
});
test("unknown references and unsafe export paths are blocked", () => {
  assert.throws(() => assertEvidence(["invented"], new Set(["real"])));
  assert.throws(() => assertEvidence([], new Set()));
  for (const path of ["../secret", "/etc/passwd", "folder/../../env", "x\\y"])
    assert.throws(() => safePath(path));
  assert.equal(safePath("product/PRD.md"), "product/PRD.md");
});
test("quality rejects broken graph, cyclic task dependencies and stale prototype", () => {
  assert.equal(quality(fixture()).mandatory_pass, true);
  let b = fixture();
  b.screens[0].components[0].target = "SCR-missing";
  assert.equal(quality(b).mandatory_pass, false);
  b = fixture();
  b.tasks[0].dependencies = ["TASK-001"];
  assert.equal(quality(b).mandatory_pass, false);
  b = fixture();
  b.prototype = { ...b.prototype, screens: [] };
  assert.equal(quality(b).mandatory_pass, false);
  b = fixture();
  b.tests[0].validates = ["invented"];
  assert.equal(quality(b).mandatory_pass, false);
});
test("independent consistency review is mandatory and major findings block", () => {
  assert.equal(reviewedQuality(fixture(), null).mandatory_pass, false);
  assert.equal(
    reviewedQuality(fixture(), { summary: "Coherent fixture", findings: [] })
      .mandatory_pass,
    true,
  );
  assert.equal(
    reviewedQuality(fixture(), {
      summary: "Conflict",
      findings: [
        {
          severity: "major",
          artifact_key: "RULE-001",
          issue: "Contradictory",
          fix: "Reconcile",
        },
      ],
    }).mandatory_pass,
    false,
  );
});
test("idempotent IDs and timezone scheduling", async () => {
  assert.equal(await stableId("a"), await stableId("a"));
  assert.notEqual(await stableId("a"), await stableId("b"));
  const now = new Date("2026-09-08T22:30:00Z");
  assert.equal(localDate("Africa/Cairo", now), "2026-09-09");
  assert.equal(scheduleDue("Africa/Cairo", "08:00", now), false);
});
