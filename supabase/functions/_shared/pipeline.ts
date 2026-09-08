import { z } from "zod";
import { strengthBands } from "./taxonomy.ts";
import { Store, admin, type Env, type Row } from "./store.ts";
import { ai } from "./ai.ts";
import { opportunityMatch, conceptMatch } from "./dedupe.ts";
import { collectSource, evidenceDraft, supportedSources } from "./sources.ts";
import {
  factorSchema,
  technicalSchema,
  consistencySchema,
  reviewedQuality,
  analysisSchema,
  extractedSchema,
  opportunitySchema,
  blueprintSchema,
  documentBundle,
  quality,
  weighted,
  recommend,
  appWeights,
  gameWeights,
  confidenceWeights,
  localDate,
  normalize,
  stableId,
  assertEvidence,
} from "./domain.ts";
const stamp = () => new Date().toISOString();
async function assertActive(s: Store, job: Row) {
  const current = await s.one("research_jobs", job.id);
  if (
    current.status === "cancelled" ||
    (job.research_run_id &&
      (await s.one("research_runs", job.research_run_id)).status ===
        "cancelled")
  )
    throw Error("JOB_CANCELLED");
  if (
    current.status !== "running" ||
    current.attempt_count !== job.attempt_count
  )
    throw Error("STALE_JOB_ATTEMPT");
}
async function cached<T>(
  s: Store,
  job: Row,
  fn: () => Promise<T>,
  key = "ai",
): Promise<T> {
  await assertActive(s, job);
  if (job.result_ref?.[key]) return job.result_ref[key];
  const value = await fn();
  await assertActive(s, job);
  job.result_ref = { ...job.result_ref, [key]: value };
  await s.update("research_jobs", job.id, { result_ref: job.result_ref });
  return value;
}
async function runEvidence(s: Store, run: Row) {
  const ids = run.stats?.evidence_ids || [];
  if (!ids.length) return [];
  const { data, error } = await s.db
    .from("evidence")
    .select("*")
    .eq("owner_id", s.owner)
    .in("id", ids);
  if (error) throw Error(error.message);
  return data as Row[];
}
function evidenceContext(items: Row[]) {
  return items.map((e) => ({
    id: e.id,
    title: e.title,
    url: e.canonical_url,
    source: e.source_type,
    date: e.published_at,
    text: e.normalized_text?.slice(0, 4500),
  }));
}
export async function processJob(s: Store, env: Env, job: Row): Promise<Row> {
  job.deadline_at = Date.now() + 120000;
  const run = job.research_run_id
    ? await s.one("research_runs", job.research_run_id)
    : null;
  if (run?.status === "cancelled") return { cancelled: true };
  if (job.job_type === "COLLECT") {
    await s.update("research_runs", run!.id, {
      status: "running",
      started_at: run!.started_at || stamp(),
    });
    const sources = await s.list("research_sources", { enabled: true });
    const warnings: string[] = [];
    const evidenceIds: string[] = [];
    const market = (
      await s.db
        .from("markets")
        .select("*")
        .eq("code", run!.config_snapshot.market || "GLOBAL")
        .single()
    ).data;
    for (const source of sources) {
      const sid = await stableId(job.id + source.id);
      await s.put("source_runs", {
        id: sid,
        research_run_id: run!.id,
        source_id: source.id,
        market_id: market?.id,
        status: "running",
        started_at: stamp(),
      });
      try {
        if (!supportedSources.includes(source.key))
          throw Error("ADAPTER_UNAVAILABLE");
        const items = await collectSource(
          source.key,
          run!.config_snapshot.query,
          market?.code || "GLOBAL",
          run!.config_snapshot.max_items || 12,
        );
        await assertActive(s, job);
        for (const item of items) {
          const draft = await evidenceDraft(
            item,
            source,
            run!.id,
            market?.id || null,
          );
          const existing = (
            await s.list(
              "evidence",
              { source_id: source.id, content_hash: draft.content_hash },
              1,
            )
          )[0];
          const saved =
            existing ||
            (await s.insert("evidence", { ...draft, source_run_id: sid }));
          evidenceIds.push(saved.id);
          if (saved.source_type === "user_review")
            await s.put("review_items", {
              id: await stableId(s.owner + saved.external_id),
              evidence_id: saved.id,
              external_id: saved.external_id,
              market_id: market?.id || null,
              language: "en",
              rating: saved.raw_payload.rating,
              review_text: saved.normalized_text,
              published_at: saved.published_at,
            });
        }
        await s.update("source_runs", sid, {
          status: "success",
          item_count: items.length,
          completed_at: stamp(),
        });
        await s.update("research_sources", source.id, {
          last_success_at: stamp(),
          last_error_code: null,
        });
      } catch (e) {
        const code = e instanceof Error ? e.message : "SOURCE_FAILED";
        if (["JOB_CANCELLED", "STALE_JOB_ATTEMPT"].includes(code)) throw e;
        warnings.push(source.name + ": " + code);
        await s.update("source_runs", sid, {
          status: "failed",
          error_code: code,
          completed_at: stamp(),
        });
        await s.update("research_sources", source.id, {
          last_error_code: code,
        });
      }
    }
    await assertActive(s, job);
    await s.update("research_runs", run!.id, {
      stats: {
        ...run!.stats,
        evidence_ids: evidenceIds,
        evidence: evidenceIds.length,
      },
      warning_count: warnings.length,
      error_summary: warnings,
    });
    if (evidenceIds.length)
      await s.enqueue("EXTRACT", run!.id + ":EXTRACT", {}, run!.id);
    return { items: evidenceIds.length, warnings };
  }
  if (job.job_type === "EXTRACT") {
    const evidence = await runEvidence(s, run!);
    const allowed = new Set(evidence.map((e) => e.id));
    const result = await cached(s, job, () =>
      ai(
        s,
        env,
        "claim_extractor",
        extractedSchema,
        evidenceContext(evidence),
        "Extract atomic claims and distinct meaningful mobile-market signals. Strength is a qualitative class: weak, moderate, strong or extreme, NOT measured growth. Store metadata alone cannot establish growth without historical comparison. Return 4–12 claims and 3–8 signals when justified.",
        job,
      ),
    );
    for (const [i, c] of result.claims.entries()) {
      assertEvidence(c.evidence_ids, allowed);
      const row = await s.put("claims", {
        id: await stableId(job.id + ":claim:" + i),
        claim_type: "market_observation",
        claim_text: c.text,
        verification: c.verification,
        confidence: c.confidence,
        created_by_role: "claim_extractor",
      });
      for (const id of c.evidence_ids)
        await s.put(
          "claim_evidence",
          { claim_id: row.id, evidence_id: id, relation: "supports" },
          "claim_id,evidence_id,relation",
        );
    }
    for (const [i, signal] of result.signals.entries()) {
      assertEvidence(signal.evidence_ids, allowed);
      const row = await s.put("signals", {
        id: await stableId(job.id + ":signal:" + i),
        research_run_id: run!.id,
        signal_type: signal.type,
        title: signal.title,
        summary: signal.summary,
        direction: signal.direction,
        strength: strengthBands[signal.strength],
        strength_class: signal.strength,
        confidence: signal.confidence,
        is_estimate: true,
      });
      for (const id of signal.evidence_ids)
        await s.put("signal_evidence", {
          id: await stableId(row.id + id),
          signal_id: row.id,
          evidence_id: id,
        });
    }
    await s.enqueue("DISCOVER", run!.id + ":DISCOVER", {}, run!.id);
    return { claims: result.claims.length, signals: result.signals.length };
  }
  if (job.job_type === "DISCOVER") {
    const evidence = await runEvidence(s, run!);
    const signals = await s.list("signals", { research_run_id: run!.id });
    const result = await cached(s, job, () =>
      ai(
        s,
        env,
        "opportunity_generator",
        opportunitySchema,
        {
          evidence: evidenceContext(evidence),
          signals,
          query: run!.config_snapshot.query,
        },
        "Group related signals into opportunities. Distinguish market problem from product concept. Suggest at most " +
          Math.min(run!.config_snapshot.max_deep_candidates || 2, 5) +
          " well-grounded opportunities. Apps/games allocation: " +
          JSON.stringify(run!.config_snapshot.allocation) +
          ". Use one of these opportunity types: ORIGINAL_INNOVATION, COMPETITOR_IMPROVEMENT, NICHE_SPECIALIZATION, LOCALIZATION_ARBITRAGE, BUSINESS_MODEL_INNOVATION, PLATFORM_EXPANSION, FEATURE_UNBUNDLING, FEATURE_BUNDLING, TREND_EXPLOITATION, WORKFLOW_REPLACEMENT. Do not propose gambling, adult content, surveillance, illegal services or deceptive products. Each needs a specific wedge; do not claim revenue or trend growth without evidence.",
        job,
      ),
    );
    for (const [i, candidate] of result.opportunities.entries())
      await s.enqueue(
        "DEDUPE",
        job.id + ":DEDUPE:" + i,
        { candidate },
        run!.id,
      );
    return { candidates: result.opportunities.length };
  }
  if (job.job_type === "DEDUPE") {
    const evidence = await runEvidence(s, run!);
    const signals = await s.list("signals", { research_run_id: run!.id });
    const result = {
      opportunities: [
        opportunitySchema.shape.opportunities.element.parse(
          job.payload.candidate,
        ),
      ],
    };
    const existing = await s.list("opportunities", {}, 1000);
    const concepts: string[] = [];
    const allowed = new Set(evidence.map((e) => e.id));
    for (const [i, o] of result.opportunities.entries()) {
      assertEvidence(o.evidence_ids, allowed);
      const normalized = normalize(o.problem + " " + o.audience);
      const dedupe = await cached(
        s,
        job,
        () => opportunityMatch(s, env, o, existing, job),
        "opportunity_match",
      );
      let opp = dedupe.match;
      if (opp)
        await s.update("opportunities", opp.id, { last_seen_at: stamp() });
      else
        opp = await s.put("opportunities", {
          id: await stableId(job.id + ":opp:" + i),
          title: o.title,
          problem_statement: o.problem,
          job_to_be_done: o.jtbd,
          target_audience: o.audience,
          why_now: o.why_now,
          opportunity_type: o.type,
          app_or_game: o.app_or_game,
          normalized_key: normalized,
          embedding: dedupe.embedding,
          embedding_model: dedupe.model,
        });
      if (!existing.some((x) => x.id === opp!.id)) existing.push(opp);
      const cluster = await s.put("signal_clusters", {
        id: await stableId(job.id + ":cluster:" + i),
        research_run_id: run!.id,
        title: o.title,
        summary: o.problem,
        cluster_key: normalized,
        embedding: dedupe.embedding,
        confidence: Math.min(...signals.map((x) => Number(x.confidence)), 60),
      });
      const edges = await s.list("signal_evidence", {}, 1000);
      for (const sig of signals.filter((sig) =>
        edges.some(
          (edge) =>
            edge.signal_id === sig.id &&
            o.evidence_ids.includes(edge.evidence_id),
        ),
      )) {
        await s.put(
          "signal_cluster_members",
          { cluster_id: cluster.id, signal_id: sig.id },
          "cluster_id,signal_id",
        );
        await s.put(
          "opportunity_signals",
          { opportunity_id: opp.id, signal_id: sig.id },
          "opportunity_id,signal_id",
        );
      }
      await s.put("opportunity_timeline_events", {
        id: await stableId(job.id + opp.id),
        opportunity_id: opp.id,
        event_type: "signal_added",
        summary: "Research linked new evidence and evaluated this opportunity.",
        payload: {
          research_run_id: run!.id,
          evidence_ids: o.evidence_ids,
          dedupe_reason: dedupe.reason,
          dedupe_policy: dedupe.policy,
        },
      });
      for (const c of o.concepts.slice(0, 1)) {
        const candidates = await s.list("product_concepts", {
          opportunity_id: opp.id,
        });
        const decision = await cached(
          s,
          job,
          () => conceptMatch(s, env, c, candidates, job),
          "concept_match",
        );
        const prior = candidates.find((x) => x.id === decision.match_id);
        const concept =
          prior ||
          (await s.put(
            "product_concepts",
            {
              opportunity_id: opp.id,
              title: c.title,
              value_proposition: c.value_proposition,
              target_user: c.target_user,
              wedge: c.wedge,
              mvp_thesis: c.mvp_thesis,
              monetization_candidates: c.monetization,
              distribution_candidates: c.distribution,
            },
            "owner_id,opportunity_id,title",
          ));
        await s.put("opportunity_timeline_events", {
          id: await stableId(job.id + ":concept:" + concept.id),
          opportunity_id: opp.id,
          concept_id: concept.id,
          event_type: prior ? "signal_added" : "discovered",
          summary: decision.reason,
          payload: {
            dedupe_level: "product_concept",
            research_run_id: run!.id,
            matched_existing: !!prior,
          },
        });
        concepts.push(concept.id);
        await s.enqueue(
          "ANALYZE",
          run!.id + ":ANALYZE:" + concept.id,
          { concept_id: concept.id },
          run!.id,
        );
      }
    }
    await s.update("research_runs", run!.id, {
      stats: {
        ...run!.stats,
        concept_ids: concepts,
        concepts: concepts.length,
      },
    });
    return { concepts: concepts.length };
  }
  if (job.job_type === "ANALYZE") {
    const concept = await s.one("product_concepts", job.payload.concept_id);
    const opportunity = await s.one("opportunities", concept.opportunity_id);
    const evidence = await runEvidence(s, run!);
    const weights =
      opportunity.app_or_game === "game" ? gameWeights : appWeights;
    const result = await cached(s, job, () =>
      ai(
        s,
        env,
        "market_analyst",
        analysisSchema.extend({
          factors: z.object(
            Object.fromEntries(
              Object.keys(weights).map((k) => [k, factorSchema]),
            ),
          ),
        }),
        {
          concept,
          opportunity,
          evidence: evidenceContext(evidence),
          weights,
          market: run!.config_snapshot.market,
        },
        "Deep analysis. Return exactly the supplied factor keys. Every factual assessment must reference supplied evidence IDs. For a factor with no supporting source, return evidence_ids:[] and explicitly state the uncertainty; do not invent a reference. Competitor identities require real sources. Competitors include direct, indirect and substitutes only if supported. Empty review_clusters when no actual review sample exists; listing counts are not analyzed reviews. Confidence must reflect missing user voice, no measured growth history, and no revenue data. Do not promote a concept on speculative economics. Evaluate all hard kill rules: prohibited, unavailable_dependency, unsustainable_economics, no_credible_wedge, solo_maintenance, platform_policy, safety_liability. Unsupported differentiation is unknown, pure clones fail no_credible_wedge. Unknown critical dependencies belong in critical_unknowns. Be specific in gap, monetization, distribution and executive brief.",
        job,
      ),
    );
    const allowed = new Set(evidence.map((e) => e.id));
    for (const f of Object.values(result.factors)) {
      if (f.evidence_ids.length) assertEvidence(f.evidence_ids, allowed);
      else {
        f.value = Math.min(f.value, 50);
        f.rationale = "Unverified assessment: " + f.rationale;
      }
    }
    const values = Object.fromEntries(
      Object.entries(result.factors).map(([k, v]) => [k, v.value]),
    );
    const score = weighted(values, weights);
    const components = {
      ...result.confidence,
      coverage: Math.min(
        result.confidence.coverage,
        result.review_clusters.length ? 100 : 50,
      ),
    };
    const confidence = weighted(components, confidenceWeights);
    const market = (
      await s.db
        .from("markets")
        .select("id")
        .eq("code", result.market_code.toUpperCase())
        .maybeSingle()
    ).data;
    const scoring = (
      await s.list("scoring_models", {
        app_or_game: opportunity.app_or_game,
        active: true,
      })
    )[0];
    const scored = await s.put("score_snapshots", {
      id: await stableId(job.id + ":score"),
      concept_id: concept.id,
      market_id: market?.id || null,
      scoring_model_id: scoring.id,
      overall_score: score,
      factors: {
        values,
        weights,
        assessments: result.factors,
        analysis: result,
      },
    });
    const confident = await s.put("confidence_snapshots", {
      id: await stableId(job.id + ":confidence"),
      concept_id: concept.id,
      market_id: market?.id || null,
      confidence,
      components,
    });
    for (const [i, r] of result.risks.entries()) {
      assertEvidence(r.evidence_ids, allowed);
      await s.put("kill_assessments", {
        id: await stableId(job.id + ":risk:" + i),
        concept_id: concept.id,
        rule_key: r.rule,
        rule_version: "1.0",
        result: r.result,
        severity: r.severity,
        rationale: r.rationale,
        evidence_ids: r.evidence_ids,
      });
    }
    const status = recommend(
      score,
      confidence,
      result.risks.some((r) => r.severity === "hard" && r.result === "fail"),
      result.critical_unknowns,
    );
    await s.put("recommendations", {
      id: await stableId(job.id + ":rec"),
      concept_id: concept.id,
      market_id: market?.id || null,
      score_snapshot_id: scored.id,
      confidence_snapshot_id: confident.id,
      status,
      rationale: result.executive_brief,
      strongest_evidence_ids: [
        ...new Set(
          Object.values(result.factors).flatMap((f) => f.evidence_ids),
        ),
      ],
      biggest_risk: result.risks[0]?.rationale || "Insufficient evidence",
      validation_priorities: result.validation_priorities,
    });
    for (const [i, c] of result.competitors.entries()) {
      assertEvidence(c.evidence_ids, allowed);
      const comp = await s.put("competitors", {
        id: await stableId(s.owner + normalize(c.name)),
        canonical_name: c.name,
        entity_type: "product",
        website: c.url,
        canonical_key: normalize(c.name),
      });
      await s.put(
        "concept_competitors",
        {
          concept_id: concept.id,
          competitor_id: comp.id,
          relation: c.relation,
          analysis: {
            strengths: c.strengths,
            weaknesses: c.weaknesses,
            evidence_ids: c.evidence_ids,
          },
        },
        "concept_id,competitor_id",
      );
      const e = evidence.find(
        (e) =>
          c.evidence_ids.includes(e.id) &&
          e.source_type === "official_store" &&
          (normalize(e.title).includes(normalize(c.name)) ||
            normalize(c.name).includes(normalize(e.title))),
      );
      await s.put("competitor_snapshots", {
        id: await stableId(job.id + ":comp:" + i),
        competitor_id: comp.id,
        evidence_id: e?.id,
        platform: "mobile",
        rating: e?.raw_payload?.rating || null,
        review_count: e?.raw_payload?.reviewCount || null,
        price_summary:
          e?.raw_payload?.price === undefined
            ? null
            : String(e.raw_payload.price) + " " + e.raw_payload.currency,
        features: { strengths: c.strengths },
        payload: { weaknesses: c.weaknesses },
      });
    }
    for (const [i, r] of result.review_clusters.entries()) {
      assertEvidence(r.evidence_ids, allowed);
      if (
        r.evidence_ids.some(
          (id) =>
            evidence.find((e) => e.id === id)?.source_type !== "user_review",
        )
      )
        throw Error("INVALID_REVIEW_EVIDENCE");
      const sample = evidence.filter((e) => e.source_type === "user_review");
      const memberIds = [...new Set(r.evidence_ids)];
      const cluster = await s.put("review_clusters", {
        id: await stableId(job.id + ":review:" + i),
        concept_id: concept.id,
        theme: r.theme,
        category: r.category,
        sentiment: r.sentiment,
        sample_size: sample.length,
        member_count: memberIds.length,
        summary: r.summary,
        confidence,
      });
      for (const id of memberIds) {
        const item = (await s.list("review_items", { evidence_id: id }))[0];
        if (item)
          await s.put(
            "review_cluster_members",
            { cluster_id: cluster.id, review_item_id: item.id },
            "cluster_id,review_item_id",
          );
      }
    }
    await s.update("product_concepts", concept.id, {
      first_analyzed_at: concept.first_analyzed_at || stamp(),
      last_analyzed_at: stamp(),
      risks: result.risks,
    });
    await s.put("opportunity_timeline_events", {
      id: await stableId(job.id + ":timeline"),
      concept_id: concept.id,
      event_type: "score_changed",
      summary: "Analysis completed: " + score + "/100 · " + status,
      payload: { score, confidence, model: scoring.version },
    });
    return { concept_id: concept.id, score, confidence, status };
  }
  if (job.job_type.startsWith("BLUEPRINT")) {
    const project = await s.one("projects", job.payload.project_id);
    const snapshot = project.frozen_research_snapshot;
    if (job.job_type === "BLUEPRINT_REVIEW") {
      const version = await s.one("blueprint_versions", job.payload.version_id);
      if (project.current_blueprint_version_id !== version.id)
        return { superseded: true };
      const review = await cached(s, job, () =>
        ai(
          s,
          env,
          "consistency_reviewer",
          consistencySchema,
          { blueprint: version.manifest },
          "Independently audit requirements, screens, rules, data, privacy, monetization, tasks and tests for material contradictions or omissions. Do not invent requirements outside approved scope. Return findings with stable IDs, concrete rationale and severity. Critical means development would be unsafe or impossible; major means core scope or behavior is contradictory. Minor polish does not block.",
          job,
        ),
      );
      const report = reviewedQuality(version.manifest, review);
      await s.update("blueprint_versions", version.id, {
        consistency_review: review,
      });
      await s.insert("quality_reports", {
        project_id: project.id,
        blueprint_version_id: version.id,
        ...report,
      });
      await s.update("projects", project.id, {
        status: report.mandatory_pass ? "prototype_ready" : "quality_blocked",
      });
      await s.db
        .from("change_requests")
        .update({
          status: report.mandatory_pass ? "validating" : "failed_validation",
        })
        .eq("owner_id", s.owner)
        .eq("applied_version_id", version.id)
        .eq("status", "validating");
      return { version: version.id, report };
    }
    if (job.job_type === "BLUEPRINT_CHANGE") {
      const change = await s.one("change_requests", job.payload.change_id);
      const version = await s.one(
        "blueprint_versions",
        change.base_blueprint_version_id,
      );
      if (change.status === "cancelled") return { cancelled: true };
      if (project.current_blueprint_version_id !== version.id)
        throw Error("VERSION_CONFLICT");
      await s.update("change_requests", change.id, { status: "analyzing" });
      const changed = await cached(s, job, () =>
        ai(
          s,
          env,
          "change_manager",
          blueprintSchema,
          { blueprint: version.manifest, request: change.request_text },
          "Apply the requested change coherently across all affected requirements, features, rules, screens, flows, tasks and tests. Preserve stable IDs. Return the complete revised structured blueprint. Do not add unrelated scope. Retain full coverage and all references.",
          job,
        ),
      );
      const bundle = documentBundle(changed, snapshot);
      const entityImpacts: Row[] = [];
      for (const family of [
        "requirements",
        "features",
        "rules",
        "screens",
        "flows",
        "decisions",
        "tasks",
        "tests",
      ] as const) {
        const before = version.manifest[family] || [],
          after = bundle[family];
        for (const key of new Set(
          [...before, ...after].map((e: Row) => e.stable_key),
        )) {
          const old = before.find((e: Row) => e.stable_key === key),
            next = after.find((e) => e.stable_key === key);
          if (JSON.stringify(old) !== JSON.stringify(next))
            entityImpacts.push({
              artifact_kind: family,
              artifact_key: key,
              action: !old ? "add" : !next ? "remove" : "update",
              reason: change.request_text,
              risk: /owner|auth|purchas|delet|remov|privacy/i.test(
                JSON.stringify([old, next]),
              )
                ? "Review access, data and business consequences"
                : "Review behavior and coverage",
              proposed_change: JSON.stringify({
                before: old || null,
                after: next || null,
              }),
            });
        }
      }
      const impacts = [
        ...entityImpacts,
        ...bundle.documents
          .filter(
            (d) =>
              version.manifest.documents.find((x: Row) => x.path === d.path)
                ?.content_md !== d.content_md,
          )
          .map((d) => ({
            artifact_kind: "document",
            artifact_key: d.path,
            action: "update",
            reason: "Affected by requested change",
            risk: "Review before applying",
            proposed_change: d.title,
          })),
      ];
      for (const [i, impact] of impacts.entries())
        await s.put("change_impacts", {
          id: await stableId(change.id + ":impact:" + i),
          change_request_id: change.id,
          ...impact,
        });
      if ((await s.one("change_requests", change.id)).status === "cancelled")
        return { cancelled: true };
      await s.update("change_requests", change.id, {
        status: "impact_ready",
        normalized_request: change.request_text,
        impact_summary: { bundle, impacts, quality: quality(bundle) },
      });
      return { change_id: change.id, impacts: impacts.length };
    }
    if (job.job_type === "BLUEPRINT_GENERATE") {
      const schema = blueprintSchema.pick({
        product: true,
        requirements: true,
        features: true,
        rules: true,
        decisions: true,
      });
      const part = await cached(s, job, async () =>
        ai(
          s,
          env,
          "blueprint_product_architect",
          schema,
          {
            research: snapshot,
            development_profile: (await s.list("app_settings"))[0]
              .development_profile,
          },
          "Produce a precise Flutter-aware product blueprint for the frozen concept. 4–7 MVP requirements/features; 3–5 business rules. Use REQ-001, FEAT-001, RULE-001, DEC-001 stable IDs. Include detailed architecture/security/analytics/launch paragraphs. Document research-derived versus explicit product judgment in research_trace. Do not invent market facts.",
          job,
        ),
      );
      await s.enqueue("BLUEPRINT_UX", job.id + ":UX", {
        project_id: project.id,
        part,
      });
      return { stage: "product" };
    }
    if (job.job_type === "BLUEPRINT_UX") {
      const schema = blueprintSchema.pick({ screens: true, flows: true });
      const part = await cached(s, job, () =>
        ai(
          s,
          env,
          "blueprint_ux_architect",
          schema,
          job.payload.part,
          "Design complete mobile screen inventory (4–7 screens) and user flows. Use SCR-001 and FLOW-001 IDs. Every screen has default/loading/empty/error/offline states as text. Navigation arrays and flow.steps contain ONLY existing SCR IDs. Components are heading/text/button/input/card/list, with target null or valid SCR ID. Avoid self navigation except explicit refresh. All product requirements must be represented.",
          job,
        ),
      );
      await s.enqueue("BLUEPRINT_TECH", job.id + ":TECH", {
        project_id: project.id,
        part: { ...job.payload.part, ...part },
      });
      return { stage: "ux" };
    }
    if (job.job_type === "BLUEPRINT_TECH") {
      const technical = await cached(s, job, () =>
        ai(
          s,
          env,
          "blueprint_technical_architect",
          technicalSchema,
          job.payload.part,
          "Define a complete technical and commercial specification consistent with the product, rules and screens. Explicit data entity fields/types/relationships, local versus remote storage, migrations, retention, integration auth/failure/rate/privacy/testing, Flutter architecture/state/navigation/dependency/environment/offline/platform policy, analytics, security, design tokens and light/dark states, monetization and store setup, ASO and measurable launch validation. Choose the smallest viable architecture; do not introduce scope. Label judgments and unknowns honestly.",
          job,
        ),
      );
      await s.enqueue("BLUEPRINT_PLAN", job.id + ":PLAN", {
        project_id: project.id,
        part: { ...job.payload.part, technical },
      });
      return { stage: "technical" };
    }
    if (job.job_type === "BLUEPRINT_PLAN") {
      const schema = blueprintSchema.pick({
        tasks: true,
        tests: true,
        links: true,
      });
      const part = await cached(s, job, () =>
        ai(
          s,
          env,
          "blueprint_task_planner",
          schema,
          job.payload.part,
          "Create ordered Flutter implementation tasks and test specifications. Each REQ and RULE must appear in at least one test.validates. Every feature and screen must appear in trace links. All link endpoints and task.implements reference existing stable IDs. Task dependencies reference earlier TASK IDs. Explicitly link requirements->features->screens and rules->tests. IDs TEST-001, TASK-001. Provide practical test steps and acceptance results.",
          job,
        ),
      );
      const blueprint = blueprintSchema.parse({ ...job.payload.part, ...part });
      const bundle = documentBundle(blueprint, snapshot);
      const version = await s.rpc("center_save_blueprint", {
        p_owner: s.owner,
        p_project: project.id,
        p_expected: project.current_blueprint_version_id,
        p_bundle: bundle,
        p_summary: "Generated from frozen research",
      });
      await s.enqueue("BLUEPRINT_REVIEW", version + ":REVIEW", {
        project_id: project.id,
        version_id: version,
      });
      const report = reviewedQuality(bundle, null);
      await s.insert("quality_reports", {
        project_id: project.id,
        blueprint_version_id: version,
        ...report,
      });
      await s.update("projects", project.id, {
        status: report.mandatory_pass ? "prototype_ready" : "quality_blocked",
      });
      return { version, quality: report };
    }
  }
  throw Error("UNKNOWN_JOB_TYPE");
}
async function finalize(s: Store, runId: string) {
  const run = await s.one("research_runs", runId);
  if (!["queued", "running"].includes(run.status)) return;
  const jobs = await s.list("research_jobs", { research_run_id: runId }, 1000);
  if (
    jobs.some((j) =>
      ["queued", "running", "leased", "retry_wait"].includes(j.status),
    )
  )
    return;
  const failures = jobs.filter((j) => j.status === "dead_letter");
  const cost = (
    await s.list("ai_invocations", { research_run_id: runId }, 1000)
  ).reduce((sum, x) => sum + Number(x.cost_usd), 0);
  const budget = failures.some((j) => j.last_error_code?.includes("BUDGET"));
  await s.update("research_runs", runId, {
    status: budget
      ? "budget_limited"
      : failures.length || run.warning_count
        ? "completed_with_warnings"
        : "completed",
    completed_at: stamp(),
    ai_cost_usd: cost,
    warning_count: run.warning_count + failures.length,
    error_summary: [
      ...run.error_summary,
      ...failures.map((j) => j.job_type + ": " + j.last_error_code),
    ],
  });
  const results = jobs
    .filter((j) => j.job_type === "ANALYZE" && j.status === "succeeded")
    .map((j) => j.result_ref)
    .sort((a, b) => b.score - a.score);
  const eligible = results.find(
    (x) =>
      ["BUILD", "STRONG_BUILD"].includes(x.status) &&
      x.score >= run.config_snapshot.min_score &&
      x.confidence >= run.config_snapshot.min_confidence,
  );
  const date = localDate(run.config_snapshot.timezone);
  const existing = (
    await s.list("daily_promotions", { promotion_date: date })
  )[0];
  if (!existing?.promoted) {
    const rec = eligible
      ? (
          await s.list("recommendations", { concept_id: eligible.concept_id })
        ).sort((a, b) => b.created_at.localeCompare(a.created_at))[0]
      : null;
    await s.put(
      "daily_promotions",
      {
        owner_id: s.owner,
        promotion_date: date,
        timezone: run.config_snapshot.timezone,
        promoted: !!eligible,
        concept_id: eligible?.concept_id || null,
        score_snapshot_id: rec?.score_snapshot_id || null,
        confidence_snapshot_id: rec?.confidence_snapshot_id || null,
        recommendation_id: rec?.id || null,
        best_candidate_concept_id: results[0]?.concept_id || null,
        no_promotion_reason: eligible
          ? null
          : failures.length
            ? "Research coverage is incomplete. Review run warnings."
            : "No candidate met the score and confidence thresholds.",
        metadata: { run_id: runId },
      },
      "owner_id,promotion_date",
    );
  }
}
export async function tick(env: Env) {
  const db = admin(env);
  const system = new Store(db, "");
  for (const queue of ["research_jobs", "blueprint_jobs"]) {
    const job = await system.rpc("center_claim", { p_queue: queue });
    if (!job) continue;
    const s = new Store(db, job.owner_id);
    try {
      const result = await processJob(s, env, job);
      await s.rpc("center_finish_attempt", {
        p_job: job.id,
        p_queue: queue,
        p_message: job.message_id,
        p_attempt: job.attempt_count,
        p_result: result,
      });
    } catch (e) {
      const code = (e instanceof Error ? e.message : "WORKER_ERROR").slice(
        0,
        180,
      );
      console.error(
        JSON.stringify({ event: "job_failed", job_id: job.id, code }),
      );
      await s.rpc("center_finish_attempt", {
        p_job: job.id,
        p_queue: queue,
        p_message: job.message_id,
        p_attempt: job.attempt_count,
        p_result: null,
        p_error: code,
        p_retry:
          /TIMEOUT|NETWORK|HTTP_5|RATE_LIMIT|AI_SCHEMA_INVALID|AI_JSON_INVALID|UNSUPPORTED_EVIDENCE_REFERENCE/i.test(
            code,
          ),
      });
    }
    if (job.research_run_id) await finalize(s, job.research_run_id);
    break;
  }
  const active = await db
    .from("research_runs")
    .select("id,owner_id")
    .in("status", ["queued", "running"])
    .limit(50);
  for (const run of active.data || [])
    await finalize(new Store(db, run.owner_id), run.id);
}
