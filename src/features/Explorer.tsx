import { useState } from "react";
import { useLocation, useSearchParams, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  ArrowUpRight,
  ArrowLeft,
  ArrowRight,
  FlaskConical,
  RefreshCw,
} from "lucide-react";
import { api, human, date, money, type Row } from "../lib/client";
import {
  PageHeader,
  Loading,
  ErrorBox,
  Empty,
  Badge,
  Dialog,
  JSONView,
} from "../components/ui";
import ResearchDialog from "./ResearchDialog";
const routes: Record<string, [string, string, string]> = {
  "/opportunities": [
    "opportunities",
    "Market opportunities",
    "The problems, unmet needs and signals behind your next product.",
  ],
  "/ideas": [
    "ideas",
    "Ideas library",
    "Your analyzed product concepts, organized for a clear decision.",
  ],
  "/ideas/shortlist": [
    "ideas",
    "Shortlist",
    "The ideas you want to consider next.",
  ],
  "/ideas/watchlist": [
    "ideas",
    "Watchlist",
    "Opportunities to follow as the market changes.",
  ],
  "/ideas/passed": [
    "ideas",
    "Passed ideas",
    "Decisions retained for future reference.",
  ],
  "/ideas/killed": [
    "recommendations",
    "Killed ideas",
    "Structural blockers and their evidence.",
  ],
  "/discover/trends": [
    "signals",
    "Market signals & trends",
    "Observed signals with evidence and confidence. Growth needs historical evidence.",
  ],
  "/discover/markets": [
    "markets",
    "Explore markets",
    "Global discovery. Local understanding.",
  ],
  "/discover/categories": [
    "categories",
    "App & game categories",
    "A structured taxonomy for focused discovery.",
  ],
  "/discover/daily": [
    "promotions",
    "Daily opportunities",
    "Every research day has an outcome — including an honest no-opportunity result.",
  ],
  "/intelligence/signals": [
    "signals",
    "Signal intelligence",
    "Trace each observation back to its original evidence.",
  ],
  "/intelligence/competitors": [
    "competitors",
    "Competitor landscape",
    "Direct competitors, alternatives and substitutes.",
  ],
  "/intelligence/reviews": [
    "reviews",
    "Voice of the customer",
    "Real sampled feedback, recurring friction and feature gaps.",
  ],
  "/intelligence/gaps": [
    "opportunities",
    "Market gaps",
    "The underserved jobs and audiences that could become your advantage.",
  ],
  "/intelligence/sources": [
    "sources",
    "Research sources",
    "Source coverage, connectivity and collection health.",
  ],
  "/projects": [
    "projects",
    "Project blueprints",
    "Turn the right idea into an implementation-ready product plan.",
  ],
  "/research/runs": [
    "runs",
    "Research operations",
    "Follow your research from fresh evidence to a considered recommendation.",
  ],
  "/research/jobs": [
    "jobs",
    "Job monitor",
    "Durable work, bounded retries and visible failures.",
  ],
  "/research/evidence": [
    "evidence",
    "Evidence library",
    "Original observations with provenance and collection dates.",
  ],
};
export default function Explorer() {
  const { pathname } = useLocation();
  return [
    "/ideas",
    "/ideas/shortlist",
    "/ideas/watchlist",
    "/ideas/passed",
    "/ideas/killed",
  ].includes(pathname) ? (
    <DecisionExplorer />
  ) : (
    <RecordsExplorer />
  );
}
function RecordsExplorer() {
  const loc = useLocation();
  const [params, setParams] = useSearchParams();
  const [inspect, setInspect] = useState<Row | null>(null),
    [research, setResearch] = useState(false);
  const qc = useQueryClient();
  const parts = loc.pathname.split("/").filter(Boolean);
  const runId =
    parts[0] === "research" && parts[1] === "runs" ? parts[2] : undefined;
  const detailId =
    parts[0] === "intelligence" && parts[1] === "competitors"
      ? parts[2]
      : undefined;
  const evidenceId =
    parts[0] === "research" && parts[1] === "evidence" ? parts[2] : undefined;
  const oppId = parts[0] === "opportunities" ? parts[1] : undefined;
  const base = runId
    ? "/research/jobs"
    : detailId
      ? "/intelligence/competitors"
      : evidenceId
        ? "/research/evidence"
        : oppId
          ? "/opportunities"
          : loc.pathname;
  const config = routes[base];
  const spec = config || [
    "ideas",
    "Page not found",
    "This workspace page does not exist.",
  ];
  let query = params.toString();
  if (runId) query += "&research_run_id=" + runId;
  if (detailId || evidenceId || oppId)
    query += "&id=" + (detailId || evidenceId || oppId);
  const disposition = loc.pathname.endsWith("/shortlist")
    ? "shortlisted"
    : loc.pathname.endsWith("/watchlist")
      ? "watching"
      : loc.pathname.endsWith("/passed")
        ? "passed"
        : null;
  if (disposition) query += "&disposition=" + disposition;
  if (loc.pathname.endsWith("/killed")) query += "&status=KILLED";
  const q = useQuery({
    queryKey: ["table", base, query],
    queryFn: () => api("/table/" + spec[0] + "?" + query),
    refetchInterval: 5000,
    enabled: !!config,
  });
  const rq = useQuery({
    queryKey: ["run", runId],
    queryFn: () => api("/table/runs?id=" + runId),
    enabled: !!runId,
    refetchInterval: 4000,
  });
  const run = rq.data?.items?.[0];
  const cancel = useMutation({
    mutationFn: () => api("/runs/" + runId + "/cancel", "POST", {}),
    onSuccess: () => qc.invalidateQueries(),
  });
  if (!config)
    return (
      <Empty
        title="Page not found"
        text="Return to your workspace to continue."
      >
        <Link className="button" to="/">
          Open overview
        </Link>
      </Empty>
    );
  const items = q.data?.items || [];
  const titleField = ["competitors"].includes(spec[0])
    ? "canonical_name"
    : spec[0] === "reviews"
      ? "theme"
      : ["projects", "sources", "markets", "categories"].includes(spec[0])
        ? "name"
        : spec[0] === "jobs"
          ? "job_type"
          : spec[0] === "promotions"
            ? "promotion_date"
            : "title";
  const rowLink = (r: Row) =>
    spec[0] === "ideas"
      ? "/ideas/" + r.id
      : spec[0] === "projects"
        ? "/projects/" + r.id
        : spec[0] === "runs"
          ? "/research/runs/" + r.id
          : spec[0] === "opportunities"
            ? "/opportunities/" + r.id
            : undefined;
  return (
    <>
      <PageHeader
        eyebrow={runId ? "RESEARCH RUN" : "INTELLIGENCE WORKSPACE"}
        title={runId ? run?.config_snapshot?.query || "Research run" : spec[1]}
        description={
          runId
            ? "Stage progress, source outcomes and processing history."
            : spec[2]
        }
      >
        <button className="button" onClick={() => q.refetch()}>
          <RefreshCw size={15} />
          Refresh
        </button>
        {spec[0] === "runs" || spec[0] === "opportunities" ? (
          <button className="button primary" onClick={() => setResearch(true)}>
            <FlaskConical size={16} />
            Run research
          </button>
        ) : null}
      </PageHeader>
      {run && (
        <div className="card run-summary">
          <Badge value={run.status} />
          <span>{date(run.created_at)}</span>
          <span>{run.stats?.evidence || 0} evidence items</span>
          <span>{run.stats?.concepts || 0} concepts</span>
          <span>
            {money(run.ai_cost_usd)} / {money(run.ai_budget_usd)}
          </span>
          {["queued", "running"].includes(run.status) && (
            <button
              className="button small"
              disabled={cancel.isPending}
              onClick={() => cancel.mutate()}
            >
              Cancel run
            </button>
          )}
          {run.error_summary?.length > 0 && (
            <div className="run-warnings">
              {run.error_summary.map((x: string) => (
                <p key={x}>{x}</p>
              ))}
            </div>
          )}
        </div>
      )}
      {q.error && <ErrorBox error={q.error} />}
      <section className="card">
        <div className="table-toolbar">
          <div className="input-icon">
            <Search size={16} />
            <input
              aria-label="Search records"
              placeholder="Search this view…"
              value={params.get("q") || ""}
              onChange={(e) => setParams({ q: e.target.value, page: "0" })}
            />
          </div>
          <span className="muted">{q.data?.count || 0} records</span>
        </div>
        {q.isPending ? (
          <Loading />
        ) : items.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>
                    {spec[0] === "jobs"
                      ? "Stage"
                      : spec[0] === "runs"
                        ? "Research focus"
                        : "Name / observation"}
                  </th>
                  <th>Context</th>
                  <th>Status / confidence</th>
                  <th>Updated</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((r: Row) => (
                  <tr key={r.id}>
                    <td>
                      {rowLink(r) ? (
                        <Link className="title-link" to={rowLink(r)!}>
                          {r[titleField] ||
                            r.config_snapshot?.query ||
                            human(r.mode)}
                        </Link>
                      ) : (
                        <button
                          className="plain title-link"
                          onClick={() => setInspect(r)}
                        >
                          {r[titleField] || r.role_key || r.id.slice(0, 8)}
                        </button>
                      )}
                      <small className="table-subtext">
                        {r.value_proposition ||
                          r.problem_statement ||
                          r.summary ||
                          r.source_type ||
                          r.last_error_code ||
                          r.no_promotion_reason ||
                          ""}
                      </small>
                    </td>
                    <td>
                      {r.app_or_game
                        ? human(r.app_or_game)
                        : r.relation
                          ? human(r.relation)
                          : r.region ||
                            r.source_type ||
                            r.mode ||
                            (r.attempt_count !== undefined
                              ? "Attempt " +
                                r.attempt_count +
                                " / " +
                                r.max_attempts
                              : "—")}
                    </td>
                    <td>
                      {r.status || r.disposition ? (
                        <Badge value={r.status || r.disposition} />
                      ) : r.confidence !== undefined ? (
                        <span>{r.confidence}% confidence</span>
                      ) : r.enabled !== undefined ? (
                        <Badge value={r.enabled ? "Enabled" : "Disabled"} />
                      ) : r.promoted !== undefined ? (
                        <Badge
                          value={r.promoted ? "Promoted" : "No promotion"}
                        />
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td>
                      {date(r.updated_at || r.created_at || r.observed_at)}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        aria-label="Inspect record"
                        onClick={() => setInspect(r)}
                      >
                        <ArrowUpRight size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No records yet"
            text={
              spec[0] === "reviews"
                ? "Review clusters appear only after actual user feedback is collected and analyzed."
                : "Research will populate this view with real, traceable data."
            }
          />
        )}
        <div className="pagination">
          <span>Page {Number(params.get("page") || 0) + 1}</span>
          <button
            className="button small"
            disabled={!Number(params.get("page") || 0)}
            onClick={() =>
              setParams({
                ...Object.fromEntries(params),
                page: String(Number(params.get("page") || 0) - 1),
              })
            }
          >
            <ArrowLeft size={14} />
            Previous
          </button>
          <button
            className="button small"
            disabled={
              (Number(params.get("page") || 0) + 1) * 30 >= (q.data?.count || 0)
            }
            onClick={() =>
              setParams({
                ...Object.fromEntries(params),
                page: String(Number(params.get("page") || 0) + 1),
              })
            }
          >
            Next
            <ArrowRight size={14} />
          </button>
        </div>
      </section>
      {oppId && items[0] && <OpportunityConcepts id={oppId} />}
      {inspect && (
        <Dialog
          title={inspect[titleField] || "Record details"}
          onClose={() => setInspect(null)}
          wide
        >
          {inspect.canonical_url && (
            <a
              className="text-link"
              href={
                /^https?:\/\//.test(inspect.canonical_url)
                  ? inspect.canonical_url
                  : undefined
              }
              target="_blank"
              rel="noreferrer"
            >
              Open original source
              <ArrowUpRight size={15} />
            </a>
          )}
          <JSONView value={inspect} />
          {spec[0] === "jobs" &&
            ["dead_letter", "cancelled"].includes(inspect.status) && (
              <button
                className="button primary"
                onClick={async () => {
                  try {
                    await api("/jobs/" + inspect.id + "/retry", "POST", {});
                    setInspect(null);
                    q.refetch();
                  } catch (e) {
                    setInspect({
                      ...inspect,
                      retry_error:
                        e instanceof Error ? e.message : "Retry failed",
                    });
                  }
                }}
              >
                Retry job
              </button>
            )}
        </Dialog>
      )}
      {research && <ResearchDialog onClose={() => setResearch(false)} />}
    </>
  );
}
function DecisionExplorer() {
  const { pathname } = useLocation();
  const [params, setParams] = useSearchParams();
  const [selected, setSelected] = useState<string[]>([]);
  const [compare, setCompare] = useState(false);
  const bootstrap = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api("/bootstrap"),
  });
  const query = new URLSearchParams(params);
  const disposition = pathname.endsWith("shortlist")
    ? "shortlisted"
    : pathname.endsWith("watchlist")
      ? "watching"
      : pathname.endsWith("passed")
        ? "passed"
        : undefined;
  if (disposition) query.set("disposition", disposition);
  if (pathname.endsWith("killed")) query.set("recommendation", "KILLED");
  const q = useQuery({
    queryKey: ["decisions", query.toString()],
    queryFn: () => api("/decisions?" + query),
    refetchInterval: 10000,
  });
  const setFilter = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "0");
    setParams(next);
  };
  return (
    <>
      <PageHeader
        eyebrow="DECISION WORKSPACE"
        title={routes[pathname][1]}
        description="Compare evidence, confidence and effort before committing to your next build."
      >
        <button
          className="button"
          disabled={selected.length < 2}
          onClick={() => setCompare(true)}
        >
          Compare {selected.length || "ideas"}
        </button>
        {!!selected.length && (
          <button className="button" onClick={() => setSelected([])}>
            Clear selection
          </button>
        )}
      </PageHeader>
      <section className="card">
        <div className="decision-filters">
          <label>
            Search ideas
            <input
              value={params.get("q") || ""}
              onChange={(e) => setFilter("q", e.target.value)}
              placeholder="Problem or product"
            />
          </label>
          <label>
            Market
            <select
              value={params.get("market") || ""}
              onChange={(e) => setFilter("market", e.target.value)}
            >
              <option value="">Latest researched market</option>
              {bootstrap.data?.markets?.map((m: Row) => (
                <option key={m.id} value={m.code}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Category
            <select
              value={params.get("category") || ""}
              onChange={(e) => setFilter("category", e.target.value)}
            >
              <option value="">All categories</option>
              {bootstrap.data?.categories?.map((c: Row) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Kind
            <select
              value={params.get("kind") || ""}
              onChange={(e) => setFilter("kind", e.target.value)}
            >
              <option value="">Apps and games</option>
              <option value="app">Apps</option>
              <option value="game">Games</option>
            </select>
          </label>
          <label>
            Recommendation
            <select
              value={params.get("recommendation") || ""}
              disabled={pathname.endsWith("killed")}
              onChange={(e) => setFilter("recommendation", e.target.value)}
            >
              <option value="">All recommendations</option>
              {[
                "STRONG_BUILD",
                "BUILD",
                "VALIDATE_FIRST",
                "WATCH",
                "PASS",
                "KILLED",
              ].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Disposition
            <select
              value={disposition || params.get("disposition") || ""}
              disabled={!!disposition}
              onChange={(e) => setFilter("disposition", e.target.value)}
            >
              <option value="">All dispositions</option>
              {[
                "undecided",
                "shortlisted",
                "watching",
                "passed",
                "archived",
                "go",
              ].map((x) => (
                <option key={x} value={x}>
                  {human(x)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Minimum score
            <input
              type="number"
              min="0"
              max="100"
              value={params.get("min_score") || ""}
              onChange={(e) => setFilter("min_score", e.target.value)}
            />
          </label>
          <label>
            Minimum confidence
            <input
              type="number"
              min="0"
              max="100"
              value={params.get("min_confidence") || ""}
              onChange={(e) => setFilter("min_confidence", e.target.value)}
            />
          </label>
          <label>
            Analyzed from
            <input
              type="date"
              value={params.get("from") || ""}
              onChange={(e) => setFilter("from", e.target.value)}
            />
          </label>
          <label>
            Analyzed through
            <input
              type="date"
              value={params.get("to") || ""}
              onChange={(e) => setFilter("to", e.target.value)}
            />
          </label>
          <label>
            Sort by
            <select
              value={params.get("sort") || "score"}
              onChange={(e) => setFilter("sort", e.target.value)}
            >
              <option value="score">Opportunity score</option>
              <option value="confidence">Research confidence</option>
              <option value="recent">Most recent analysis</option>
              <option value="title">Name</option>
            </select>
          </label>
          <button className="button" onClick={() => setParams({})}>
            Reset filters
          </button>
        </div>
        {q.error && <ErrorBox error={q.error} retry={() => q.refetch()} />}
        {q.isPending ? (
          <Loading />
        ) : q.data?.items?.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Select</th>
                  <th>Idea</th>
                  <th>Score / confidence</th>
                  <th>Decision</th>
                  <th>Market / model</th>
                  <th>Analyzed</th>
                </tr>
              </thead>
              <tbody>
                {q.data.items.map((r: Row) => (
                  <tr key={r.id}>
                    <td>
                      <input
                        type="checkbox"
                        aria-label={"Compare " + r.title}
                        checked={selected.includes(r.id)}
                        disabled={
                          !selected.includes(r.id) && selected.length >= 3
                        }
                        onChange={(e) =>
                          setSelected(
                            e.target.checked
                              ? [...selected, r.id]
                              : selected.filter((x) => x !== r.id),
                          )
                        }
                      />
                    </td>
                    <td>
                      <Link className="title-link" to={"/ideas/" + r.id}>
                        {r.title}
                      </Link>
                      <small className="table-subtext">{r.wedge}</small>
                      <small>
                        {human(r.app_or_game)} ·{" "}
                        {r.category || "Category unknown"}
                      </small>
                    </td>
                    <td>
                      <Link to={"/ideas/" + r.id}>
                        {r.score ?? "Unknown"} / {r.confidence ?? "Unknown"}
                      </Link>
                    </td>
                    <td>
                      <Badge value={r.recommendation || "Awaiting analysis"} />
                      <small className="table-subtext">
                        {human(r.disposition)}
                      </small>
                    </td>
                    <td>
                      {r.market_name || "Unstudied"}
                      <small className="table-subtext">
                        {r.model_key || "—"} {r.scoring_model_version}
                      </small>
                    </td>
                    <td>{date(r.analyzed_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          !q.error && (
            <Empty
              title="No ideas match these filters"
              text="Change the filters or run research to collect evidence."
            />
          )
        )}
        <div className="pagination">
          <span>
            {q.data?.count || 0} ideas · Page{" "}
            {Number(params.get("page") || 0) + 1}
          </span>
          <button
            className="button small"
            disabled={!Number(params.get("page") || 0)}
            onClick={() =>
              setFilter("page", String(Number(params.get("page") || 0) - 1))
            }
          >
            Previous
          </button>
          <button
            className="button small"
            disabled={
              (Number(params.get("page") || 0) + 1) * 30 >= (q.data?.count || 0)
            }
            onClick={() =>
              setFilter("page", String(Number(params.get("page") || 0) + 1))
            }
          >
            Next
          </button>
        </div>
      </section>
      {compare && (
        <Comparison ids={selected} onClose={() => setCompare(false)} />
      )}
    </>
  );
}
function Comparison({ ids, onClose }: { ids: string[]; onClose: () => void }) {
  const q = useQuery({
    queryKey: ["compare", ids],
    queryFn: () => api("/decisions/compare?ids=" + ids.join(",")),
  });
  const items = q.data?.items || [];
  const factors = [
    ...new Set<string>(
      items.flatMap((r: Row) => Object.keys(r.factors?.values || {})),
    ),
  ];
  return (
    <Dialog title="Compare ideas" wide onClose={onClose}>
      {q.isPending && <Loading />}
      {q.error && <ErrorBox error={q.error} retry={() => q.refetch()} />}
      {q.data && (
        <>
          <div className="callout">
            {q.data.notes.map((n: string) => (
              <p key={n}>{n}</p>
            ))}
          </div>
          <div className="comparison-grid">
            {items.map((r: Row) => (
              <section className="card prose-card" key={r.id}>
                <h3>
                  <Link to={"/ideas/" + r.id}>{r.title}</Link>
                </h3>
                <Badge value={r.recommendation || "Unstudied"} />
                <p>
                  Score {r.score ?? "Unknown"} · Confidence{" "}
                  {r.confidence ?? "Unknown"}
                </p>
                <small>
                  {r.market_name || "Unknown market"} · {r.model_key}{" "}
                  {r.scoring_model_version} · {date(r.analyzed_at)}
                </small>
                <h4>Wedge</h4>
                <p>{r.wedge}</p>
                <h4>Biggest risk</h4>
                <p>{r.biggest_risk || "Unknown"}</p>
                <h4>Validate next</h4>
                <p>
                  {r.validation_priorities?.[0] ||
                    "No validation step recorded"}
                </p>
                <h4>Critical unknowns</h4>
                <ul>
                  {r.factors?.analysis?.critical_unknowns?.map((v: string) => (
                    <li key={v}>{v}</li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Factor assessment</th>
                  {items.map((r: Row) => (
                    <th key={r.id}>{r.title}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {factors.map((f) => (
                  <tr key={f}>
                    <th>{human(f)}</th>
                    {items.map((r: Row) => (
                      <td key={r.id}>
                        {r.factors?.values?.[f] ?? "Unknown"}
                        <small className="table-subtext">
                          {r.factors?.assessments?.[f]?.rationale ||
                            "No supporting assessment"}
                        </small>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </Dialog>
  );
}
function OpportunityConcepts({ id }: { id: string }) {
  const { data } = useQuery({
    queryKey: ["concepts", id],
    queryFn: () => api("/table/ideas?opportunity_id=" + id),
  });
  return (
    <section className="card">
      <div className="card-heading">
        <h2>Product concepts</h2>
      </div>
      {data?.items?.map((c: Row) => (
        <Link key={c.id} to={"/ideas/" + c.id} className="activity-row">
          <span>
            <b>{c.title}</b>
            <small>{c.value_proposition}</small>
          </span>
          <ArrowUpRight size={18} />
        </Link>
      ))}
    </section>
  );
}
