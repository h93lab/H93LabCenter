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
  const reserved = await Promise.allSettled([
    a.s.rpc("center_reserve_ai", {
      p_owner: a.id,
      p_role: "test",
      p_max: 0.01,
    }),
    a.s.rpc("center_reserve_ai", {
      p_owner: a.id,
      p_role: "test",
      p_max: 0.01,
    }),
  ]);
  assert.ok(reserved.every((r) => r.status === "rejected"));
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
  await a.s.rpc("center_publish", {
    p_owner: a.id,
    p_project: p.id,
    p_version: v,
    p_report: report,
  });

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
  console.log(passes + " integration checks passed.");
} finally {
  // Fixtures are removed only from the dedicated local test owners. Never touch the real owner.
  for (const id of owners) {
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
