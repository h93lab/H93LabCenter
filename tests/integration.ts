import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { handle } from "../supabase/functions/_shared/api.ts";
import { Store, admin, type Env } from "../supabase/functions/_shared/store.ts";
import { fixture } from "./fixtures.ts";
import {
  quality,
  reviewedQuality,
} from "../supabase/functions/_shared/domain.ts";
process.loadEnvFile(".env.server");
const env = process.env as unknown as Env;
if (!env.SUPABASE_URL.includes("127.0.0.1:55321"))
  throw Error("ISOLATED_LOCAL_ONLY");
const db = admin(env),
  owners: string[] = [];
let passes = 0;
function pass(message: string) {
  console.log("PASS", message);
  passes++;
}
async function owner() {
  const email = "test-" + crypto.randomUUID() + "@h93lab.local",
    password = randomBytes(24).toString("hex");
  const { data, error } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  owners.push(data.user.id);
  const client = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
    auth: { persistSession: false },
  });
  const auth = await client.auth.signInWithPassword({ email, password });
  if (auth.error) throw auth.error;
  return {
    id: data.user.id,
    client,
    token: auth.data.session!.access_token,
    s: new Store(db, data.user.id),
  };
}
async function call(
  token: string,
  path: string,
  method = "GET",
  body?: unknown,
) {
  const res = await handle(
    new Request("http://local/api" + path, {
      method,
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    }),
    env,
  );
  return { status: res.status, body: await res.json() };
}
try {
  const a = await owner(),
    b = await owner();
  await db
    .from("app_settings")
    .update({
      daily_research_enabled: false,
      daily_ai_budget_usd: 0,
      monthly_ai_budget_usd: 0,
    })
    .in("owner_id", owners);
  assert.equal((await call("", "/bootstrap")).status, 401);
  assert.equal((await call(a.token, "/worker", "POST")).status, 401);
  pass("Authentication and private worker boundary");
  const oa = await a.s.insert("opportunities", {
    title: "Test opportunity",
    why_now: "Fixture timing",
    problem_statement: "Fixture problem",
    job_to_be_done: "Fixture job",
    target_audience: "Fixture audience",
    opportunity_type: "localization",
    app_or_game: "app",
  });
  const concept = await a.s.insert("product_concepts", {
    opportunity_id: oa.id,
    title: "Test concept",
    value_proposition: "Fixture proposition",
    target_user: "Fixture user",
    wedge: "Fixture wedge",
    mvp_thesis: "Fixture MVP",
  });
  assert.deepEqual(
    (await b.client.from("opportunities").select("*").eq("id", oa.id)).data,
    [],
  );
  assert.equal((await call(b.token, "/ideas/" + concept.id)).status, 404);
  assert.ok(
    (
      await b.client
        .from("opportunities")
        .insert({ owner_id: a.id, title: "Forbidden" })
    ).error,
  );
  assert.ok(
    (await a.client.from("projects").insert({ owner_id: a.id, name: "Forged" }))
      .error,
  );
  assert.ok((await a.client.rpc("center_go" as never, {} as never)).error);
  pass("Two-owner RLS and privileged write forgery");
  await db
    .from("ai_roles")
    .update({ enabled: true })
    .in("owner_id", owners)
    .eq("role_key", "market_analyst");
  const reserved = await Promise.allSettled([
    a.s.rpc("center_reserve_ai", {
      p_owner: a.id,
      p_role: "market_analyst",
      p_max: 0.01,
    }),
    a.s.rpc("center_reserve_ai", {
      p_owner: a.id,
      p_role: "market_analyst",
      p_max: 0.01,
    }),
  ]);
  assert.ok(
    reserved.every(
      (r) => r.status === "rejected" && /BUDGET_LIMIT/.test(r.reason.message),
    ),
  );
  pass("Atomic budget reservation rejects exhausted owners");
  const p = await a.s.insert("projects", {
    concept_id: concept.id,
    name: "Integration fixture",
    slug: "fixture",
    frozen_research_snapshot: { test: true },
  });
  const bundle = fixture();
  const v = await a.s.rpc("center_save_blueprint", {
    p_owner: a.id,
    p_project: p.id,
    p_expected: null,
    p_bundle: bundle,
  });
  assert.equal(
    (await a.s.list("blueprint_screens", { blueprint_version_id: v })).length,
    2,
  );
  const report = quality(bundle);
  const blocked = await call(
    a.token,
    "/projects/" + p.id + "/publish",
    "POST",
    { version_id: v },
  );
  assert.equal(blocked.status, 400);
  await assert.rejects(
    a.s.rpc("center_publish", {
      p_owner: a.id,
      p_project: p.id,
      p_version: v,
      p_report: report,
    }),
    /CONSISTENCY_REVIEW_REQUIRED/,
  );
  await db
    .from("blueprint_versions")
    .update({
      consistency_review: { summary: "Test fixture review", findings: [] },
    })
    .eq("id", v);
  await assert.rejects(
    a.s.rpc("center_publish", {
      p_owner: a.id,
      p_project: p.id,
      p_version: v,
      p_report: report,
    }),
    /EXPORT_NOT_READY/,
  );
  assert.equal(
    (
      await call(a.token, `/projects/${p.id}/publish`, "POST", {
        version_id: v,
      })
    ).status,
    200,
  );

  assert.ok(
    (
      await db
        .from("blueprint_requirements")
        .update({ title: "Tampered" })
        .eq("blueprint_version_id", v)
    ).error,
  );
  assert.ok(
    (
      await db
        .from("blueprint_versions")
        .update({ manifest: { tampered: true } })
        .eq("id", v)
    ).error,
  );
  assert.equal((await call(b.token, "/projects/" + p.id)).status, 404);
  pass(
    "Normalized blueprint persistence, immutable publication and owner isolation",
  );
  const saves = await Promise.allSettled([
    a.s.rpc("center_save_blueprint", {
      p_owner: a.id,
      p_project: p.id,
      p_expected: v,
      p_bundle: bundle,
    }),
    a.s.rpc("center_save_blueprint", {
      p_owner: a.id,
      p_project: p.id,
      p_expected: v,
      p_bundle: bundle,
    }),
  ]);
  assert.equal(saves.filter((x) => x.status === "fulfilled").length, 1);
  pass("Concurrent version saves serialize and reject stale base");
  const current = (await a.s.one("projects", p.id))
    .current_blueprint_version_id;
  const change = await a.s.insert("change_requests", {
    project_id: p.id,
    base_blueprint_version_id: current,
    request_text: "Fixture update",
    status: "impact_ready",
    impact_summary: { bundle },
  });
  const applied = await Promise.all([
    a.s.rpc("center_apply_change", {
      p_owner: a.id,
      p_change: change.id,
      p_report: reviewedQuality(bundle, null),
    }),
    a.s.rpc("center_apply_change", {
      p_owner: a.id,
      p_change: change.id,
      p_report: reviewedQuality(bundle, null),
    }),
  ]);
  assert.equal(applied[0], applied[1]);
  await db
    .from("research_jobs")
    .update({ status: "cancelled" })
    .eq("owner_id", a.id);
  pass("Change application is atomic and repeat submissions are idempotent");
  const exported = await call(
    a.token,
    "/projects/" + p.id + "/export",
    "POST",
    { version_id: current },
  );
  assert.equal(exported.status, 400);
  const buckets = await db.storage.listBuckets();
  assert.equal(
    buckets.data?.find((x) => x.name === "blueprint-exports")?.public,
    false,
  );
  pass("Draft export blocked and export storage private");
  const fenced = await a.s.insert("research_jobs", {
    job_type: "TEST_FENCE",
    idempotency_key: crypto.randomUUID(),
    status: "running",
    attempt_count: 2,
    queue_message_id: 999999999,
  });
  const oldAttempt = await db.rpc("center_finish_attempt", {
    p_job: fenced.id,
    p_queue: "research_jobs",
    p_message: 999999999,
    p_attempt: 1,
    p_result: {},
  });
  assert.match(oldAttempt.error?.message || "", /STALE_JOB_ATTEMPT/);
  assert.equal((await a.s.one("research_jobs", fenced.id)).status, "running");
  await a.s.update("research_jobs", fenced.id, { status: "cancelled" });
  await a.s.rpc("center_finish_attempt", {
    p_job: fenced.id,
    p_queue: "research_jobs",
    p_message: 999999999,
    p_attempt: 2,
    p_result: {},
  });
  assert.equal((await a.s.one("research_jobs", fenced.id)).status, "cancelled");
  pass("Stale queue attempts cannot complete work; cancellation is preserved");
  await db
    .from("app_settings")
    .update({ daily_ai_budget_usd: 1, monthly_ai_budget_usd: 10 })
    .eq("owner_id", a.id);
  const role = (await a.s.list("ai_roles", { role_key: "market_analyst" }))[0];
  await a.s.update("ai_roles", role.id, {
    enabled: true,
    daily_budget_usd: 0,
    daily_call_limit: 1,
  });
  await assert.rejects(
    a.s.rpc("center_reserve_ai", {
      p_owner: a.id,
      p_role: role.role_key,
      p_max: 0.001,
    }),
    /ROLE_BUDGET_LIMIT/,
  );
  await a.s.rpc("center_reserve_ai", {
    p_owner: a.id,
    p_role: role.role_key,
    p_max: 0,
  });
  await assert.rejects(
    a.s.rpc("center_reserve_ai", {
      p_owner: a.id,
      p_role: role.role_key,
      p_max: 0,
    }),
    /ROLE_CALL_LIMIT/,
  );
  const zero = await call(a.token, "/research", "POST", {
    query: "isolated test",
    market: "US",
    request_key: crypto.randomUUID(),
    run_budget: 0,
  });
  assert.equal(zero.status, 202);
  const zeroRun = await a.s.one("research_runs", zero.body.data.id);
  assert.equal(zeroRun.ai_budget_usd, 0);
  assert.equal(zeroRun.config_snapshot.run_budget, 0);
  await call(a.token, `/runs/${zeroRun.id}/cancel`, "POST", {});
  pass(
    "Per-role cost/free-call limits and explicit zero run budgets are enforced",
  );

  const testJob = await a.s.insert("research_jobs", {
    job_type: "ANALYZE",
    payload: { concept_id: concept.id },
    idempotency_key: crypto.randomUUID(),
    status: "running",
    attempt_count: 1,
    leased_at: new Date().toISOString(),
    queue_message_id: 888888888,
  });
  const scoringModel = (
    await a.s.list("scoring_models", { app_or_game: "app", active: true })
  )[0];
  const sid = crypto.randomUUID(),
    cid = crypto.randomUUID(),
    rid = crypto.randomUUID();
  const writes = [
    {
      table: "score_snapshots",
      conflict: "id",
      row: {
        id: sid,
        concept_id: concept.id,
        scoring_model_id: scoringModel.id,
        overall_score: 70,
        factors: {},
      },
    },
    {
      table: "confidence_snapshots",
      conflict: "id",
      row: { id: cid, concept_id: concept.id, confidence: 60, components: {} },
    },
    {
      table: "recommendations",
      conflict: "id",
      row: {
        id: rid,
        concept_id: concept.id,
        score_snapshot_id: sid,
        confidence_snapshot_id: cid,
        status: "VALIDATE_FIRST",
        rationale: "Isolated fixture recommendation",
      },
    },
  ];
  const result = {
    concept_id: concept.id,
    score: 70,
    confidence: 60,
    status: "VALIDATE_FIRST",
    committed: true,
  };
  const args = {
    p_owner: a.id,
    p_job: testJob.id,
    p_attempt: 1,
    p_writes: writes,
    p_result: result,
  };
  await assert.rejects(
    a.s.rpc("center_commit_analysis", {
      ...args,
      p_writes: [
        ...writes,
        {
          table: "review_cluster_members",
          conflict: "cluster_id,review_item_id",
          row: {
            cluster_id: crypto.randomUUID(),
            review_item_id: crypto.randomUUID(),
          },
        },
      ],
    }),
  );
  assert.equal((await a.s.list("score_snapshots", { id: sid })).length, 0);
  assert.equal((await a.s.list("recommendations", { id: rid })).length, 0);
  await assert.rejects(
    a.s.rpc("center_commit_analysis", { ...args, p_attempt: 0 }),
    /STALE_JOB_ATTEMPT/,
  );
  await a.s.rpc("center_commit_analysis", args);
  await a.s.rpc("center_commit_analysis", args);
  assert.equal(
    (await a.s.one("research_jobs", testJob.id)).status,
    "succeeded",
  );
  assert.equal(
    (await a.s.one("recommendations", rid)).research_job_id,
    testJob.id,
  );
  pass(
    "Analysis rollback, attempt fencing and atomic successful recommendation publication",
  );

  const second = await a.s.insert("product_concepts", {
    opportunity_id: oa.id,
    title: "Second fixture",
    value_proposition: "Fixture",
    target_user: "Fixture",
    wedge: "Fixture",
    mvp_thesis: "Fixture",
  });
  const generated = await a.s.insert("projects", {
    concept_id: second.id,
    name: "Job fixture",
    slug: "job-fixture",
    frozen_research_snapshot: {},
  });
  const planJob = await a.s.insert("research_jobs", {
    job_type: "BLUEPRINT_PLAN",
    payload: { project_id: generated.id },
    idempotency_key: crypto.randomUUID(),
    status: "running",
    attempt_count: 1,
    leased_at: new Date().toISOString(),
    queue_message_id: 777777777,
  });
  const planArgs = {
    p_owner: a.id,
    p_job: planJob.id,
    p_attempt: 1,
    p_bundle: bundle,
    p_report: reviewedQuality(bundle, null),
  };
  const gv = await a.s.rpc("center_save_generated_blueprint", planArgs);
  assert.equal(await a.s.rpc("center_save_generated_blueprint", planArgs), gv);
  assert.equal(
    (await a.s.list("blueprint_versions", { project_id: generated.id })).length,
    1,
  );
  assert.equal(
    (
      await a.s.list("research_jobs", {
        job_type: "BLUEPRINT_REVIEW",
        idempotency_key: gv + ":REVIEW",
      })
    ).length,
    1,
  );
  await db
    .from("research_jobs")
    .update({ status: "cancelled" })
    .eq("owner_id", a.id)
    .in("status", ["queued", "running", "retry_wait"]);
  pass("Generated blueprint retries reuse one version and one review job");

  const review = {
    format: "json",
    content: JSON.stringify([
      {
        external_id: "fixture",
        text: "Isolated test review; never real market evidence",
        published_at: "2026-09-01T00:00:00Z",
        url: "https://example.com/review",
        app_id: "test-fixture",
        rating: 3,
      },
    ]),
    source_name: "Isolated fixture",
    source_url: "https://example.com/reviews",
    market: "US",
    platform: "ios",
    language: "en",
    sampled_at: "2026-09-02T00:00:00Z",
    confirmed_real_reviews: true,
    dataset_kind: "real",
    request_key: crypto.randomUUID(),
  };
  const preview = await call(
    a.token,
    "/evidence/import/preview",
    "POST",
    review,
  );
  assert.equal(preview.status, 200);
  assert.equal((await a.s.list("evidence")).length, 0);
  const imported = await call(
    a.token,
    `/ideas/${concept.id}/evidence/import`,
    "POST",
    review,
  );
  assert.equal(imported.status, 200);
  const replay = await call(
    a.token,
    `/ideas/${concept.id}/evidence/import`,
    "POST",
    review,
  );
  assert.equal(replay.body.data.imported, 0);
  assert.equal((await a.s.list("evidence")).length, 1);
  assert.equal(
    (
      await call(a.token, `/ideas/${concept.id}/evidence/import`, "POST", {
        ...review,
        language: "ar",
      })
    ).status,
    409,
  );
  assert.equal(
    (
      await call(
        b.token,
        `/ideas/${concept.id}/evidence/import`,
        "POST",
        review,
      )
    ).status,
    404,
  );
  const input = {
    request_key: crypto.randomUUID(),
    question: "Fixture question",
    method: "Fixture method",
    success_criterion: "Fixture criterion",
    estimated_hours: 1,
    estimated_cost_usd: 0,
    outcome: "supported",
    result: "Fixture result",
    evidence_ids: imported.body.data.evidence_ids,
    observed_at: new Date().toISOString(),
  };
  const validation = await call(
    a.token,
    `/ideas/${concept.id}/validations`,
    "POST",
    input,
  );
  assert.equal(validation.status, 200);
  assert.equal(
    (await call(a.token, `/ideas/${concept.id}/validations`, "POST", input))
      .body.data.id,
    validation.body.data.id,
  );
  assert.equal(
    (await call(b.token, `/ideas/${concept.id}/validations`)).status,
    404,
  );
  assert.deepEqual(
    (
      await b.client
        .from("concept_evidence")
        .select("*")
        .eq("concept_id", concept.id)
    ).data,
    [],
  );
  const list = await call(a.token, "/decisions?min_score=65&sort=score");
  assert.equal(list.status, 200);
  assert.equal(list.body.data.items[0].score, 70);
  assert.equal(list.body.data.items[0].confidence, 60);
  assert.equal(
    (await call(a.token, `/decisions/compare?ids=${concept.id},${second.id}`))
      .status,
    200,
  );
  assert.equal(
    (await call(b.token, `/decisions/compare?ids=${concept.id},${second.id}`))
      .status,
    404,
  );
  const detail = await call(a.token, `/ideas/${concept.id}/decision`);
  assert.equal(detail.status, 200);
  assert.equal(detail.body.data.evidence.length, 1);
  const scoped = await call(a.token, `/ideas/${concept.id}/refresh`, "POST", {
    market: "US",
    run_budget: 0,
    request_key: crypto.randomUUID(),
  });
  assert.equal(scoped.status, 202);
  assert.equal(
    (await a.s.one("research_runs", scoped.body.data.id)).config_snapshot
      .concept_id,
    concept.id,
  );
  await call(a.token, `/runs/${scoped.body.data.id}/cancel`, "POST", {});
  pass(
    "Review import preview/replay, validation provenance, decision pairing and scoped research isolation",
  );
  const olderVersions = Array.from({ length: 105 }, (_, i) => ({
    owner_id: a.id,
    project_id: generated.id,
    version_number: i + 2,
    status: "draft",
    manifest: bundle,
  }));
  const historyInsert = await db
    .from("blueprint_versions")
    .insert(olderVersions);
  if (historyInsert.error) throw historyInsert.error;
  const history = await call(a.token, `/projects/${generated.id}`);
  assert.equal(history.status, 200);
  assert.equal(history.body.data.versions.length, 106);
  assert.equal(history.body.data.version.id, gv);
  const unlinked = await db.from("score_snapshots").insert(
    Array.from({ length: 105 }, () => ({
      owner_id: a.id,
      concept_id: concept.id,
      scoring_model_id: scoringModel.id,
      overall_score: 99,
      factors: {},
    })),
  );
  if (unlinked.error) throw unlinked.error;
  assert.equal(
    (await call(a.token, `/ideas/${concept.id}`)).body.data.scores.length,
    106,
  );
  assert.equal(
    (await call(a.token, "/decisions?min_score=65")).body.data.items[0].score,
    70,
  );
  const mergedRun = await a.s.insert("research_runs", {
    mode: "manual",
    status: "running",
    ai_budget_usd: 0,
    config_snapshot: {},
    stats: { retained: true },
  });
  const mergeJobs = await Promise.all(
    [1, 2].map(() =>
      a.s.insert("research_jobs", {
        job_type: "DEDUPE",
        research_run_id: mergedRun.id,
        idempotency_key: crypto.randomUUID(),
        status: "running",
        attempt_count: 1,
        leased_at: new Date().toISOString(),
      }),
    ),
  );
  await Promise.all(
    mergeJobs.map((job, index) =>
      a.s.rpc("center_merge_run_concepts", {
        p_owner: a.id,
        p_run: mergedRun.id,
        p_job: job.id,
        p_attempt: 1,
        p_concepts: [index ? second.id : concept.id],
      }),
    ),
  );
  const stats = (await a.s.one("research_runs", mergedRun.id)).stats;
  assert.equal(stats.retained, true);
  assert.equal(stats.concept_ids.length, 2);
  await call(a.token, `/runs/${mergedRun.id}/cancel`, "POST", {});
  pass(
    "Histories beyond 100 retain the current version and paired scores; concurrent dedupe merges retain every concept",
  );
  console.log(passes + " integration checks passed.");
} finally {
  // Fixtures are removed only from the dedicated local test owners. Never touch the real owner.
  for (const id of owners) {
    const exports = await db
      .from("export_packages")
      .select("storage_path")
      .eq("owner_id", id);
    if (exports.data?.length)
      await db.storage
        .from("blueprint-exports")
        .remove(exports.data.map((e) => e.storage_path));
    await db
      .from("research_jobs")
      .update({ status: "cancelled" })
      .eq("owner_id", id);
    await db
      .from("blueprint_versions")
      .update({ status: "superseded" })
      .eq("owner_id", id);
    const result = await db.auth.admin.deleteUser(id);
    if (result.error)
      console.error("Fixture cleanup pending:", result.error.code);
  }
}
