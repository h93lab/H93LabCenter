import { z } from "zod";
import { figmaReceiptSchema, fileHandoff } from "./figma.ts";
import { zipSync, strToU8 } from "fflate";
import { Store, admin, type Env, type Row } from "./store.ts";
import { models } from "./ai.ts";
import {
  documentBundle,
  blueprintSchema,
  quality,
  reviewedQuality,
  sha,
  safePath,
  scheduleDue,
  localDate,
  type Bundle,
} from "./domain.ts";
import { supportedSources } from "./sources.ts";
import { tick } from "./pipeline.ts";
const tableMap: Record<
  string,
  { table: string; search?: string; sort?: string; catalog?: boolean }
> = {
  opportunities: {
    table: "opportunities",
    search: "title",
    sort: "last_seen_at",
  },
  ideas: { table: "product_concepts", search: "title", sort: "created_at" },
  signals: { table: "signals", search: "title", sort: "observed_at" },
  competitors: {
    table: "competitors",
    search: "canonical_name",
    sort: "created_at",
  },
  reviews: { table: "review_clusters", search: "theme", sort: "created_at" },
  sources: { table: "research_sources", search: "name" },
  runs: { table: "research_runs", sort: "created_at" },
  jobs: { table: "research_jobs", sort: "created_at" },
  evidence: { table: "evidence", search: "title", sort: "collected_at" },
  projects: { table: "projects", search: "name", sort: "created_at" },
  markets: { table: "markets", search: "name", catalog: true },
  categories: { table: "categories", search: "name", catalog: true },
  roles: { table: "ai_roles", search: "role_key" },
  prompts: { table: "prompt_versions", search: "role_key", sort: "created_at" },
  usage: { table: "ai_invocations", search: "role_key", sort: "created_at" },
  scores: { table: "score_snapshots", sort: "calculated_at" },
  recommendations: { table: "recommendations", sort: "created_at" },
  timeline: { table: "opportunity_timeline_events", sort: "occurred_at" },
  promotions: { table: "daily_promotions", sort: "promotion_date" },
};
export async function startRun(s: Store, input: Row) {
  const settings = (await s.list("app_settings"))[0];
  if (!settings) throw Error("OWNER_BOOTSTRAP_MISSING");
  const marketPreferences = await s.list("owner_market_preferences");
  const cfg = {
    market_preferences: marketPreferences,
    ...settings.research_config,
    ...input,
    timezone: settings.timezone,
    allocation: {
      apps: settings.apps_allocation,
      games: settings.games_allocation,
    },
    min_score: settings.idea_of_day_min_score,
    min_confidence: settings.idea_of_day_min_confidence,
    max_deep_candidates: settings.max_deep_candidates,
  };
  const enabled = await s.list("research_sources", { enabled: true });
  if (!enabled.some((x) => supportedSources.includes(x.key)))
    throw Error("NO_SUPPORTED_SOURCES");
  const key = input.request_key || crypto.randomUUID();
  return s.rpc("center_start_run", {
    p_owner: s.owner,
    p_key: key,
    p_config: cfg,
    p_budget: Math.min(
      Number(settings.research_config?.run_budget) || 0.5,
      settings.daily_ai_budget_usd,
    ),
    p_mode: input.mode || "manual",
  });
}
async function scheduledMarket(s: Store, timezone: string) {
  const prefs = (await s.list("owner_market_preferences"))
    .filter((p) => p.enabled)
    .sort((a, b) => b.priority - a.priority);
  if (!prefs.length) return "GLOBAL";
  const day = Math.floor(
    new Date(localDate(timezone) + "T00:00:00Z").getTime() / 86400000,
  );
  const chosen = prefs[day % Math.min(prefs.length, 5)];
  return (
    (
      await s.db
        .from("markets")
        .select("code")
        .eq("id", chosen.market_id)
        .single()
    ).data?.code || "GLOBAL"
  );
}
export async function dispatch(env: Env) {
  const db = admin(env);
  const { data, error } = await db
    .from("app_settings")
    .select("*")
    .eq("daily_research_enabled", true);
  if (error) throw error;
  const results = [];
  for (const cfg of data) {
    if (scheduleDue(cfg.timezone, cfg.daily_research_local_time)) {
      try {
        results.push(
          await startRun(new Store(db, cfg.owner_id), {
            query: cfg.research_config.query || "mobile productivity",
            market: await scheduledMarket(
              new Store(db, cfg.owner_id),
              cfg.timezone,
            ),
            request_key: "daily:" + localDate(cfg.timezone),
            mode: "scheduled",
          }),
        );
      } catch (e) {
        if (!(e instanceof Error && e.message.includes("RUN_ALREADY_ACTIVE")))
          throw e;
      }
    }
  }
  return results;
}
async function rows(s: Store, key: string, url: URL) {
  const spec = tableMap[key];
  if (!spec) throw Error("NOT_FOUND");
  const page = Math.max(0, Number(url.searchParams.get("page")) || 0);
  let q = s.db.from(spec.table).select("*", { count: "exact" });
  if (!spec.catalog) q = q.eq("owner_id", s.owner);
  const search = url.searchParams.get("q");
  if (search && spec.search)
    q = q.ilike(spec.search, "%" + search.replace(/[%_]/g, "") + "%");
  for (const field of [
    "id",
    "concept_id",
    "research_run_id",
    "opportunity_id",
    "disposition",
    "status",
    "app_or_game",
  ]) {
    const value = url.searchParams.get(field);
    if (value) q = q.eq(field, value);
  }
  if (spec.sort) q = q.order(spec.sort, { ascending: false });
  const { data, error, count } = await q.range(page * 30, page * 30 + 29);
  if (error) throw Error(error.message);
  return { items: data, count, page };
}
async function idea(s: Store, id: string) {
  const concept = await s.one("product_concepts", id);
  const opportunity = await s.one("opportunities", concept.opportunity_id);
  const [
    scores,
    confidence,
    recommendations,
    risks,
    relations,
    reviews,
    timeline,
  ] = await Promise.all([
    s.list("score_snapshots", { concept_id: id }),
    s.list("confidence_snapshots", { concept_id: id }),
    s.list("recommendations", { concept_id: id }),
    s.list("kill_assessments", { concept_id: id }),
    s.list("concept_competitors", { concept_id: id }),
    s.list("review_clusters", { concept_id: id }),
    s.list("opportunity_timeline_events", { concept_id: id }),
  ]);
  scores.sort((a, b) => b.calculated_at.localeCompare(a.calculated_at));
  recommendations.sort((a, b) => b.created_at.localeCompare(a.created_at));
  const evidenceIds = [
    ...new Set(recommendations.flatMap((x) => x.strongest_evidence_ids || [])),
  ];
  const { data: evidence } = evidenceIds.length
    ? await s.db
        .from("evidence")
        .select("*")
        .eq("owner_id", s.owner)
        .in("id", evidenceIds)
    : { data: [] };
  const competitors = await Promise.all(
    relations.map(async (r) => ({
      ...(await s.one("competitors", r.competitor_id)),
      ...r,
      snapshots: await s.list("competitor_snapshots", {
        competitor_id: r.competitor_id,
      }),
    })),
  );
  return {
    concept,
    opportunity,
    scores,
    confidence,
    recommendations,
    risks,
    competitors,
    reviews,
    timeline,
    evidence,
  };
}
async function project(s: Store, id: string) {
  const p = await s.one("projects", id);
  const versions = await s.list("blueprint_versions", { project_id: id });
  versions.sort((a, b) => b.version_number - a.version_number);
  return {
    project: p,
    versions,
    version: versions.find((v) => v.id === p.current_blueprint_version_id),
    quality: await s.list("quality_reports", { project_id: id }),
    changes: await s.list("change_requests", { project_id: id }),
    prototypes: await s.list("prototype_artifacts", { project_id: id }),
    exports: await s.list("export_packages", { project_id: id }),
  };
}
const uuid = z.string().uuid();
export async function handle(req: Request, env: Env): Promise<Response> {
  const origin = req.headers.get("origin");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Vary: "Origin",
    "Access-Control-Allow-Headers": "authorization,apikey,content-type",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,OPTIONS",
    "X-Content-Type-Options": "nosniff",
  };
  if (origin === env.APP_ORIGIN)
    headers["Access-Control-Allow-Origin"] = origin;
  const send = (data: unknown, status = 200) =>
    new Response(
      JSON.stringify({
        ok: status < 400,
        ...(status < 400 ? { data } : { error: data }),
        request_id: crypto.randomUUID(),
      }),
      { status, headers },
    );
  if (origin && origin !== env.APP_ORIGIN)
    return send({ code: "ORIGIN_DENIED" }, 403);
  if (req.method === "OPTIONS")
    return new Response(null, { status: 204, headers });
  const url = new URL(req.url);
  const path =
    url.pathname
      .replace(/^\/functions\/v1\/center|^\/api/, "")
      .replace(/\/$/, "") || "/";
  try {
    if (path === "/health")
      return send({ status: "ready", service: "H93Lab Center" });
    if (path === "/worker" || path === "/dispatch") {
      if (
        req.method !== "POST" ||
        !env.WORKER_SECRET ||
        req.headers.get("authorization") !== "Bearer " + env.WORKER_SECRET
      )
        return send({ code: "UNAUTHORIZED" }, 401);
      return send(path === "/worker" ? await tick(env) : await dispatch(env));
    }
    const db = admin(env);
    const token = req.headers.get("authorization")?.replace(/^Bearer /, "");
    if (!token) return send({ code: "UNAUTHORIZED" }, 401);
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return send({ code: "UNAUTHORIZED" }, 401);
    const s = new Store(db, data.user.id);
    let body: Row = {};
    if (["POST", "PATCH"].includes(req.method)) {
      const raw = await req.text();
      if (raw.length > 1000000) return send({ code: "PAYLOAD_TOO_LARGE" }, 413);
      body = raw ? JSON.parse(raw) : {};
    }
    if (path === "/bootstrap" && req.method === "GET") {
      const [settings, sources, roles, profile, markets, categories, prefs] =
        await Promise.all([
          s.list("app_settings"),
          s.list("research_sources"),
          s.list("ai_roles"),
          s.list("profiles"),
          db.from("markets").select("*"),
          db.from("categories").select("*"),
          s.list("owner_market_preferences"),
        ]);
      return send({
        settings: settings[0],
        sources,
        roles,
        profile: profile[0],
        markets: markets.data,
        categories: categories.data,
        preferences: prefs,
        integrations: {
          openrouter: !!env.OPENROUTER_API_KEY,
          supported_sources: supportedSources,
          figma: "JSON plugin handoff",
        },
      });
    }
    if (path === "/overview" && req.method === "GET") {
      const results = await Promise.all(
        [
          "ideas",
          "opportunities",
          "runs",
          "projects",
          "usage",
          "recommendations",
          "promotions",
          "scores",
        ].map((key) => rows(s, key, new URL("http://local/"))),
      );
      const settings = (await s.list("app_settings"))[0];
      return send({
        local_date: localDate(settings.timezone),
        ...Object.fromEntries(
          [
            "ideas",
            "opportunities",
            "runs",
            "projects",
            "usage",
            "recommendations",
            "promotions",
            "scores",
          ].map((k, i) => [k, results[i]]),
        ),
      });
    }
    const parts = path.split("/").filter(Boolean);
    if (parts[0] === "table" && req.method === "GET")
      return send(await rows(s, parts[1], url));
    if (
      parts[0] === "projects" &&
      parts[2] === "figma-receipt" &&
      req.method === "POST"
    ) {
      const p = await s.one("projects", parts[1]);
      const receipt = figmaReceiptSchema.parse(body);
      const version = await s.one("blueprint_versions", receipt.version_id);
      if (receipt.project_id !== p.id || version.project_id !== p.id)
        throw Error("NOT_FOUND");
      const screens = version.manifest.screens.map(
        (screen: Row) => screen.stable_key,
      );
      if (
        screens.some((id: string) => !receipt.node_map[id]) ||
        Object.keys(receipt.node_map).some((id) => !screens.includes(id))
      )
        throw Error("FIGMA_SCREEN_MAP_MISMATCH");
      const existing = (
        await s.list("prototype_artifacts", {
          project_id: p.id,
          blueprint_version_id: version.id,
          artifact_type: "figma",
        })
      )[0];
      const patch = {
        project_id: p.id,
        blueprint_version_id: version.id,
        artifact_type: "figma",
        status: fileHandoff.getArtifactStatus(
          receipt,
          p.current_blueprint_version_id,
        ),
        spec: version.manifest.prototype,
        external_ref: { ...receipt, verification: "user_import_receipt" },
      };
      return send(
        existing
          ? await s.update("prototype_artifacts", existing.id, patch)
          : await s.insert("prototype_artifacts", patch),
      );
    }
    if (path === "/models" && req.method === "GET") {
      const embeddings = await fetch(
        "https://openrouter.ai/api/v1/embeddings/models",
        { signal: AbortSignal.timeout(15000) },
      ).then((r) => r.json());
      return send(
        [
          ...(await models()).filter((m) =>
            m.supported_parameters?.includes("response_format"),
          ),
          ...(embeddings.data || []),
        ].map((m) => ({ id: m.id, name: m.name, pricing: m.pricing })),
      );
    }
    if (path === "/research" && req.method === "POST") {
      const input = z
        .object({
          query: z.string().min(2).max(120),
          market: z.string().min(2).max(10),
          request_key: uuid,
          max_items: z.number().int().min(1).max(25).default(12),
        })
        .parse(body);
      return send({ id: await startRun(s, input) }, 202);
    }
    if (parts[0] === "runs" && parts[2] === "cancel" && req.method === "POST") {
      const run = await s.one("research_runs", parts[1]);
      if (["queued", "running"].includes(run.status)) {
        await s.update("research_runs", run.id, {
          status: "cancelled",
          completed_at: new Date().toISOString(),
        });
        await db
          .from("research_jobs")
          .update({ status: "cancelled" })
          .eq("owner_id", s.owner)
          .eq("research_run_id", run.id)
          .in("status", ["queued", "retry_wait", "leased"]);
      }
      return send({ cancelled: true });
    }
    if (parts[0] === "ideas" && parts.length === 2 && req.method === "GET")
      return send(await idea(s, parts[1]));
    if (
      parts[0] === "ideas" &&
      parts[2] === "disposition" &&
      req.method === "POST"
    ) {
      const patch = z
        .object({
          disposition: z.enum([
            "shortlisted",
            "watching",
            "passed",
            "archived",
            "undecided",
          ]),
        })
        .parse(body);
      const c = await s.update("product_concepts", parts[1], patch);
      await s.insert("opportunity_timeline_events", {
        concept_id: c.id,
        event_type: "user_disposition_changed",
        summary: "Marked " + patch.disposition,
      });
      return send(c);
    }
    if (parts[0] === "ideas" && parts[2] === "go" && req.method === "POST")
      return send(
        {
          id: await s.rpc("center_go", {
            p_owner: s.owner,
            p_concept: uuid.parse(parts[1]),
            p_key: uuid.parse(body.request_key),
          }),
        },
        202,
      );
    if (parts[0] === "projects" && parts.length === 2 && req.method === "GET")
      return send(await project(s, parts[1]));
    if (
      parts[0] === "projects" &&
      parts[2] === "fork" &&
      req.method === "POST"
    ) {
      const p = await s.one("projects", parts[1]);
      const base = await s.one(
        "blueprint_versions",
        uuid.parse(body.version_id),
      );
      if (base.project_id !== p.id) throw Error("NOT_FOUND");
      const id = await s.rpc("center_save_blueprint", {
        p_owner: s.owner,
        p_project: p.id,
        p_expected: base.id,
        p_bundle: base.manifest,
        p_summary:
          "Created an editable draft from version " + base.version_number,
      });
      if (base.consistency_review)
        await s.update("blueprint_versions", id, {
          consistency_review: base.consistency_review,
        });
      const report = reviewedQuality(base.manifest, base.consistency_review);
      await s.insert("quality_reports", {
        project_id: p.id,
        blueprint_version_id: id,
        ...report,
      });
      return send({ id });
    }
    if (
      parts[0] === "projects" &&
      parts[2] === "change" &&
      req.method === "POST"
    ) {
      const p = await s.one("projects", parts[1]);
      const input = z
        .object({ request: z.string().min(5).max(12000), base_version: uuid })
        .parse(body);
      if (p.current_blueprint_version_id !== input.base_version)
        throw Error("VERSION_CONFLICT");
      const change = await s.insert("change_requests", {
        project_id: p.id,
        base_blueprint_version_id: input.base_version,
        request_text: input.request,
        status: "created",
      });
      await s.enqueue("BLUEPRINT_CHANGE", change.id + ":CHANGE", {
        project_id: p.id,
        change_id: change.id,
      });
      return send(change, 202);
    }
    if (
      parts[0] === "changes" &&
      parts[2] === "apply" &&
      req.method === "POST"
    ) {
      const change = await s.one("change_requests", parts[1]);
      if (change.applied_version_id)
        return send({ version: change.applied_version_id });
      if (change.status !== "impact_ready") throw Error("CHANGE_NOT_READY");
      const p = await s.one("projects", change.project_id);
      const bundle = change.impact_summary.bundle;
      const report = reviewedQuality(bundle, null);
      const version = await s.rpc("center_apply_change", {
        p_owner: s.owner,
        p_change: change.id,
        p_report: report,
      });
      return send({ version, ...report });
    }
    if (
      parts[0] === "projects" &&
      ["validate", "publish", "export", "figma"].includes(parts[2]) &&
      req.method === "POST"
    ) {
      const p = await s.one("projects", parts[1]);
      const version = await s.one(
        "blueprint_versions",
        uuid.parse(body.version_id),
      );
      if (version.project_id !== p.id) throw Error("NOT_FOUND");
      const bundle = version.manifest as Bundle;
      if (parts[2] === "validate" || parts[2] === "publish") {
        if (p.current_blueprint_version_id !== version.id)
          throw Error("VERSION_CONFLICT");
        const report = reviewedQuality(bundle, version.consistency_review);
        await s.insert("quality_reports", {
          project_id: p.id,
          blueprint_version_id: version.id,
          ...report,
        });
        if (parts[2] === "publish")
          await s.rpc("center_publish", {
            p_owner: s.owner,
            p_project: p.id,
            p_version: version.id,
            p_report: report,
          });
        return send(report);
      }
      if (parts[2] === "figma")
        return send({
          project_id: p.id,
          project_name: p.name,
          version_id: version.id,
          version_number: version.version_number,
          ...bundle.prototype,
        });
      if (!["published", "superseded"].includes(version.status))
        throw Error("PUBLISH_BEFORE_EXPORT");
      const files: Record<string, Uint8Array> = {};
      const manifest: Row = {
        project_id: p.id,
        project: p.name,
        slug: p.slug,
        source_concept_id: p.concept_id,
        version: version.version_number,
        version_id: version.id,
        generated_at: new Date().toISOString(),
        schema_version: "1.0",
        prototype_version: version.id,
        quality: reviewedQuality(bundle, version.consistency_review),
        compatible_agents: ["Claude Code", "Codex", "Kimi", "Gemini CLI"],
        flutter_version_policy:
          "Latest stable at implementation time unless a version is justified in the technical plan",
        files: [],
      };
      for (const d of bundle.documents) {
        safePath(d.path);
        if (/sk-or-v1-|sb_secret_|-----BEGIN.*PRIVATE KEY/.test(d.content_md))
          throw Error("EXPORT_SECRET_DETECTED");
        files[d.path] = strToU8(d.content_md);
        manifest.files.push({ path: d.path, sha256: await sha(d.content_md) });
      }
      files["prototype/prototype.json"] = strToU8(
        JSON.stringify(bundle.prototype, null, 2),
      );
      files["prototype/figma-handoff.json"] = strToU8(
        JSON.stringify({
          project_id: p.id,
          project_name: p.name,
          version_id: version.id,
          ...bundle.prototype,
        }),
      );
      for (const path of [
        "prototype/prototype.json",
        "prototype/figma-handoff.json",
      ])
        manifest.files.push({ path, sha256: await sha(files[path]) });
      files["MANIFEST.json"] = strToU8(JSON.stringify(manifest, null, 2));
      const archive = zipSync(files, { level: 6 });
      const storagePath =
        s.owner +
        "/" +
        p.id +
        "/blueprint-v" +
        version.version_number +
        "-" +
        crypto.randomUUID() +
        ".zip";
      const uploaded = await db.storage
        .from("blueprint-exports")
        .upload(storagePath, archive, { contentType: "application/zip" });
      if (uploaded.error) throw Error("EXPORT_STORAGE_FAILED");
      const signed = await db.storage
        .from("blueprint-exports")
        .createSignedUrl(storagePath, 300);
      if (signed.error) throw Error("EXPORT_URL_FAILED");
      await s.insert("export_packages", {
        project_id: p.id,
        blueprint_version_id: version.id,
        storage_path: storagePath,
        manifest,
        archive_checksum: await sha(archive),
      });
      const download = new URL(signed.data.signedUrl);
      if (env.PUBLIC_SUPABASE_URL) {
        const publicBase = new URL(env.PUBLIC_SUPABASE_URL);
        download.protocol = publicBase.protocol;
        download.host = publicBase.host;
      }
      return send({ url: download.toString(), manifest });
    }
    if (path === "/settings" && req.method === "PATCH") {
      const schema = z
        .object({
          timezone: z.string().refine((v) => {
            try {
              new Intl.DateTimeFormat("en", { timeZone: v });
              return true;
            } catch {
              return false;
            }
          }),
          daily_research_enabled: z.boolean(),
          daily_research_local_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
          apps_allocation: z.number().int().min(0).max(100),
          games_allocation: z.number().int().min(0).max(100),
          daily_ai_budget_usd: z.number().min(0).max(100),
          monthly_ai_budget_usd: z.number().min(0).max(1000),
          max_deep_candidates: z.number().int().min(1).max(10),
          idea_of_day_min_score: z.number().min(0).max(100),
          idea_of_day_min_confidence: z.number().min(0).max(100),
          research_config: z.object({
            query: z.string().min(2).max(120),
            run_budget: z.number().min(0).max(10),
            max_items: z.number().int().min(1).max(25),
          }),
          development_profile: z.record(z.string(), z.unknown()),
        })
        .partial()
        .strict();
      const patch = schema.parse(body);
      const { data, error } = await db
        .from("app_settings")
        .update(patch)
        .eq("owner_id", s.owner)
        .select()
        .single();
      if (error) throw Error(error.message);
      return send(data);
    }
    if (parts[0] === "sources" && req.method === "PATCH") {
      const patch = z.object({ enabled: z.boolean() }).strict().parse(body);
      return send(
        await s.update("research_sources", uuid.parse(parts[1]), patch),
      );
    }
    if (parts[0] === "roles" && req.method === "PATCH") {
      const patch = z
        .object({
          primary_model: z.string().min(1),
          enabled: z.boolean(),
          max_cost_per_call_usd: z.number().min(0.001).max(5),
          fallback_models: z.array(z.string()).max(3),
          settings: z.object({
            temperature: z.number().min(0).max(2),
            max_tokens: z.number().int().min(256).max(16000),
          }),
        })
        .partial()
        .strict()
        .parse(body);
      if (patch.primary_model) {
        const role = await s.one("ai_roles", parts[1]);
        const catalog =
          role.role_key === "dedupe_embeddings"
            ? (
                await fetch(
                  "https://openrouter.ai/api/v1/embeddings/models",
                ).then((r) => r.json())
              ).data
            : await models();
        if (!catalog.some((m: Row) => m.id === patch.primary_model))
          throw Error("UNKNOWN_MODEL");
      }
      return send(await s.update("ai_roles", uuid.parse(parts[1]), patch));
    }
    if (
      parts[0] === "prompts" &&
      parts[2] === "activate" &&
      req.method === "POST"
    ) {
      await s.rpc("center_activate_prompt", {
        p_owner: s.owner,
        p_prompt: uuid.parse(parts[1]),
      });
      return send({ active: true });
    }
    if (parts[0] === "jobs" && parts[2] === "retry" && req.method === "POST") {
      await s.rpc("center_retry_job", {
        p_owner: s.owner,
        p_job: uuid.parse(parts[1]),
      });
      return send({ queued: true });
    }
    if (
      parts[0] === "changes" &&
      parts[2] === "cancel" &&
      req.method === "POST"
    ) {
      const c = await s.one("change_requests", parts[1]);
      if (!["created", "analyzing", "impact_ready"].includes(c.status))
        throw Error("CHANGE_NOT_CANCELLABLE");
      return send(
        await s.update("change_requests", c.id, {
          status: "cancelled",
          completed_at: new Date().toISOString(),
        }),
      );
    }
    if (path === "/prompts" && req.method === "POST") {
      const input = z
        .object({
          role_key: z.string().min(1),
          version: z.string().min(1).max(30),
          template: z.string().min(10).max(12000),
        })
        .strict()
        .parse(body);
      return send(
        await s.insert("prompt_versions", {
          ...input,
          is_active: false,
          schema_version: "1.0",
        }),
      );
    }
    if (parts[0] === "markets" && req.method === "PATCH") {
      const input = z
        .object({
          enabled: z.boolean(),
          priority: z.number().int().min(0).max(100),
        })
        .parse(body);
      return send(
        await s.put(
          "owner_market_preferences",
          { market_id: uuid.parse(parts[1]), ...input },
          "owner_id,market_id",
        ),
      );
    }
    if (path === "/profile" && req.method === "PATCH") {
      const input = z
        .object({ display_name: z.string().min(1).max(80) })
        .parse(body);
      const { error } = await db
        .from("profiles")
        .update(input)
        .eq("id", s.owner);
      if (error) throw error;
      return send(input);
    }
    return send({ code: "NOT_FOUND" }, 404);
  } catch (e) {
    const code =
      e instanceof z.ZodError
        ? "INVALID_INPUT"
        : e instanceof SyntaxError
          ? "INVALID_JSON"
          : e instanceof Error
            ? e.message
            : "INTERNAL_ERROR";
    const safe = /^[A-Z_0-9]+$/.test(code) ? code : "OPERATION_FAILED";
    console.error(JSON.stringify({ event: "api_error", path, code: safe }));
    return send(
      { code: safe, message: safe.replaceAll("_", " ").toLowerCase() },
      safe === "NOT_FOUND"
        ? 404
        : safe.includes("CONFLICT") || safe === "RUN_ALREADY_ACTIVE"
          ? 409
          : 400,
    );
  }
}
