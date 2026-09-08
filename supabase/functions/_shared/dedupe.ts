import { z } from "zod";
import { ai } from "./ai.ts";
import { Store, type Env, type Row } from "./store.ts";
import { normalize, similarity } from "./domain.ts";
export async function embed(s: Store, env: Env, text: string, job: Row) {
  const role = (await s.list("ai_roles", { role_key: "dedupe_embeddings" }))[0];
  if (!role?.enabled || !role.primary_model)
    throw Error("EMBEDDING_MODEL_NOT_CONFIGURED");
  const catalog = await fetch(
    "https://openrouter.ai/api/v1/embeddings/models",
    { signal: AbortSignal.timeout(15000) },
  ).then((r) => r.json());
  const model = catalog.data?.find((m: Row) => m.id === role.primary_model);
  if (!model) throw Error("EMBEDDING_MODEL_UNAVAILABLE");
  const maximum = Math.max(
    0.000001,
    new TextEncoder().encode(text).length * Number(model.pricing.prompt),
  );
  if (maximum > role.max_cost_per_call_usd) throw Error("CALL_BUDGET_LIMIT");
  const id = await s.rpc("center_reserve_ai", {
    p_owner: s.owner,
    p_role: role.role_key,
    p_max: maximum,
    p_run: job.research_run_id,
    p_job: job.id,
  });
  const started = Date.now();
  try {
    const response = await fetch("https://openrouter.ai/api/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + env.OPENROUTER_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.id,
        input: text,
        encoding_format: "float",
      }),
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) throw Error("EMBEDDING_HTTP_" + response.status);
    const data = await response.json();
    const vector = z
      .array(z.number().finite())
      .min(32)
      .max(4096)
      .parse(data.data?.[0]?.embedding);
    await s.update("ai_invocations", id, {
      status: "succeeded",
      requested_model: model.id,
      resolved_model: data.model || model.id,
      cost_usd:
        data.usage?.cost ??
        (data.usage?.prompt_tokens
          ? data.usage.prompt_tokens * Number(model.pricing.prompt)
          : maximum),
      input_tokens: data.usage?.prompt_tokens,
      latency_ms: Date.now() - started,
    });
    return { vector, model: model.id };
  } catch (e) {
    await s.update("ai_invocations", id, {
      status: "failed",
      error_code: "EMBEDDING_FAILED",
      cost_usd: maximum,
    });
    throw e;
  }
}
export async function opportunityMatch(
  s: Store,
  env: Env,
  candidate: Row,
  existing: Row[],
  job: Row,
) {
  const normalized = normalize(candidate.problem + " " + candidate.audience);
  const exact = existing.find(
    (o) =>
      o.app_or_game === candidate.app_or_game &&
      o.normalized_key === normalized,
  );
  if (exact)
    return {
      match: exact,
      embedding: exact.embedding,
      model: exact.embedding_model,
      reason: "Exact normalized problem and audience",
    };
  const embedded = await embed(
    s,
    env,
    candidate.problem +
      "\n" +
      candidate.jtbd +
      "\nAudience: " +
      candidate.audience,
    job,
  );
  const settings = (await s.list("app_settings"))[0];
  const policy = settings.dedupe_policy;
  const nearest = await s.rpc("center_similar_opportunities", {
    p_owner: s.owner,
    p_vector: JSON.stringify(embedded.vector),
    p_model: embedded.model,
    p_kind: candidate.app_or_game,
    p_threshold: policy.candidate_threshold,
  });
  let match: Row | undefined,
    reason = "New distinct market opportunity";
  const candidates = nearest
    .map((n: Row) => ({
      ...existing.find((o) => o.id === n.id),
      similarity: n.similarity,
    }))
    .filter((x: Row) => x.id);
  const strong = candidates.find(
    (c: Row) =>
      c.similarity >= policy.auto_merge_threshold &&
      similarity(c.target_audience, candidate.audience) > 0.7,
  );
  if (strong) {
    match = strong;
    reason = "High semantic and audience agreement";
  } else if (candidates.length) {
    const result = await ai(
      s,
      env,
      "dedupe_adjudicator",
      z.object({ match_id: z.string().uuid().nullable(), reason: z.string() }),
      {
        candidate,
        existing: candidates.map((o: Row) => ({
          id: o.id,
          problem: o.problem_statement,
          audience: o.target_audience,
          jtbd: o.job_to_be_done,
          similarity: o.similarity,
        })),
      },
      "Decide whether the candidate describes the SAME unmet job for the SAME audience as an existing opportunity. Related topics are not duplicates. Return an existing id only for a duplicate, otherwise null. Never merge distinct audiences or jobs.",
      job,
    );
    if (result.match_id) {
      match = candidates.find((c: Row) => c.id === result.match_id);
      if (!match) throw Error("INVALID_DEDUPE_REFERENCE");
    }
    reason = result.reason;
  }
  return {
    match,
    embedding: JSON.stringify(embedded.vector),
    model: embedded.model,
    reason,
    policy: policy.version,
  };
}

export async function conceptMatch(
  s: Store,
  env: Env,
  candidate: Row,
  existing: Row[],
  job: Row,
) {
  const exact = existing.find(
    (x) =>
      normalize(x.wedge + " " + x.target_user) ===
      normalize(candidate.wedge + " " + candidate.target_user),
  );
  if (exact)
    return { match_id: exact.id, reason: "Exact solution wedge and audience" };
  if (!existing.length)
    return {
      match_id: null,
      reason: "First product concept for this opportunity",
    };
  const result = await ai(
    s,
    env,
    "dedupe_adjudicator",
    z.object({ match_id: z.string().uuid().nullable(), reason: z.string() }),
    {
      candidate,
      existing: existing.map((x) => ({
        id: x.id,
        wedge: x.wedge,
        target_user: x.target_user,
        value_proposition: x.value_proposition,
        mvp_thesis: x.mvp_thesis,
      })),
    },
    "Compare product concepts within the SAME market opportunity. Match only substantially the SAME solution/wedge for the SAME user. Rephrasing is a duplicate; materially different solutions are new concepts. Return one supplied existing id or null, and the reason.",
    job,
  );
  if (result.match_id && !existing.some((x) => x.id === result.match_id))
    throw Error("INVALID_DEDUPE_REFERENCE");
  return result;
}
