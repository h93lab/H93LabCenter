import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  FlaskConical,
  ArrowUpRight,
  Compass,
  Layers,
  FolderKanban,
  Coins,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Clock3,
} from "lucide-react";
import { api, date, money } from "../lib/client";
import {
  PageHeader,
  Metric,
  Badge,
  Empty,
  Loading,
  ErrorBox,
  Score,
} from "../components/ui";
import ResearchDialog from "./ResearchDialog";
export default function Dashboard() {
  const [research, setResearch] = useState(false);
  const q = useQuery({
    queryKey: ["overview"],
    queryFn: () => api("/overview"),
    refetchInterval: 5000,
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} retry={() => q.refetch()} />;
  const d = q.data!;
  const latest = d.runs.items[0];
  const promotionToday = d.promotions.items.find(
    (p: any) => p.promotion_date === d.local_date,
  );
  const promoted = promotionToday?.promoted ? promotionToday : null;
  const daily = d.ideas.items.find((i: any) => i.id === promoted?.concept_id);
  const recommendations = d.recommendations.items;
  const scored = d.ideas.items
    .map((i: any) => ({
      ...i,
      score: d.scores.items.find((s: any) => s.concept_id === i.id),
      recommendation: recommendations.find((r: any) => r.concept_id === i.id),
    }))
    .sort(
      (a: any, b: any) =>
        (b.score?.overall_score || 0) - (a.score?.overall_score || 0),
    );
  return (
    <>
      <PageHeader
        eyebrow="YOUR OPPORTUNITY RADAR"
        title="Workspace overview"
        description="What changed, what matters, and what to build next."
      >
        <Link className="button" to="/research/runs">
          View research
          <ArrowUpRight size={15} />
        </Link>
        <button className="button primary" onClick={() => setResearch(true)}>
          <FlaskConical size={16} />
          Run research
        </button>
      </PageHeader>
      <div className="research-strip">
        <span className="status-dot" />
        <b>{latest ? "Latest research" : "Research engine ready"}</b>
        {latest ? (
          <>
            <Badge value={latest.status} />
            <span>{date(latest.created_at)}</span>
          </>
        ) : (
          <span>
            Start your first run to discover evidence-backed opportunities.
          </span>
        )}
        <Link
          to={latest ? "/research/runs/" + latest.id : "/settings/research"}
        >
          {latest ? "View run" : "Configure research"}
          <ArrowRight size={14} />
        </Link>
      </div>
      <div className="metrics-grid">
        <Metric
          label="Opportunities discovered"
          value={d.opportunities.count}
          note="Market problems worth exploring"
          icon={<Compass size={17} />}
        />
        <Metric
          label="Analyzed ideas"
          value={d.ideas.count}
          note="Product concepts from your research"
          icon={<Layers size={17} />}
        />
        <Metric
          label="Blueprint projects"
          value={d.projects.count}
          note="From a decision to a build plan"
          icon={<FolderKanban size={17} />}
        />
        <Metric
          label="Recent AI spend"
          value={money(
            d.usage.items.reduce(
              (a: number, b: any) => a + Number(b.cost_usd),
              0,
            ),
          )}
          note="Across the latest 30 invocations"
          icon={<Coins size={17} />}
        />
      </div>
      <div className="dashboard-main-grid">
        <section className="card opportunity-spotlight">
          <div className="card-heading">
            <h2>
              <Sparkles size={17} /> Opportunity of the day
            </h2>
            <span className="eyebrow">QUALITY OVER QUANTITY</span>
          </div>
          {daily ? (
            <>
              <div className="spotlight-body">
                <Badge value="Promoted opportunity" />
                <h2>{daily.title}</h2>
                <p>{daily.value_proposition}</p>
                <Score
                  value={Number(
                    d.scores.items.find(
                      (s: any) => s.id === promoted.score_snapshot_id,
                    )?.overall_score,
                  )}
                />
                <Link className="button primary" to={"/ideas/" + daily.id}>
                  Explore full analysis
                  <ArrowRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <Empty
              title={
                latest
                  ? "No high-confidence opportunity today"
                  : "Your next opportunity is out there"
              }
              text={
                promotionToday?.no_promotion_reason ||
                "Your research engine will surface the strongest idea here — when the evidence earns it."
              }
            >
              <button className="button" onClick={() => setResearch(true)}>
                Start exploring
                <ArrowRight size={15} />
              </button>
            </Empty>
          )}
        </section>
        <section className="card workflow-card">
          <div className="card-heading">
            <h2>Your path to a new product</h2>
          </div>
          <div className="workflow-step">
            <span>01</span>
            <div>
              <h3>Discover the opportunity</h3>
              <p>Real sources, signals and unmet needs.</p>
            </div>
            <Compass size={19} />
          </div>
          <div className="workflow-step">
            <span>02</span>
            <div>
              <h3>Make an informed decision</h3>
              <p>Explainable scores and evidence.</p>
            </div>
            <CheckCircle2 size={19} />
          </div>
          <div className="workflow-step">
            <span>03</span>
            <div>
              <h3>Build your blueprint</h3>
              <p>Specifications, prototype and a clear plan.</p>
            </div>
            <FolderKanban size={19} />
          </div>
          <div className="workflow-note">
            <span className="status-dot" /> Designed for Flutter · Android & iOS
          </div>
        </section>
      </div>
      <section className="card">
        <div className="card-heading">
          <div>
            <h2>Strongest candidates</h2>
            <p>Ranked by the latest opportunity score.</p>
          </div>
          <Link to="/ideas" className="text-link">
            All ideas
            <ArrowUpRight size={15} />
          </Link>
        </div>
        {!scored.length ? (
          <Empty
            title="A clear view starts with evidence"
            text="Your researched ideas will appear here with scores, confidence and a recommendation."
          />
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product concept</th>
                  <th>Score</th>
                  <th>Recommendation</th>
                  <th>Last analyzed</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {scored.slice(0, 6).map((i: any) => (
                  <tr key={i.id}>
                    <td>
                      <Link className="title-link" to={"/ideas/" + i.id}>
                        {i.title}
                      </Link>
                      <small className="table-subtext">{i.wedge}</small>
                    </td>
                    <td>
                      <b>{i.score?.overall_score ?? "—"}</b>
                      <span className="muted"> / 100</span>
                    </td>
                    <td>
                      <Badge
                        value={i.recommendation?.status || "awaiting_analysis"}
                      />
                    </td>
                    <td>{date(i.last_analyzed_at)}</td>
                    <td>
                      <Link
                        to={"/ideas/" + i.id}
                        aria-label={"Open " + i.title}
                      >
                        <ArrowUpRight size={17} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
      <div className="bottom-grid">
        <section className="card">
          <div className="card-heading">
            <h2>Recent research</h2>
            <Clock3 size={17} />
          </div>
          {d.runs.items.length ? (
            d.runs.items.slice(0, 4).map((r: any) => (
              <Link
                key={r.id}
                to={"/research/runs/" + r.id}
                className="activity-row"
              >
                <span className="activity-icon">
                  <FlaskConical size={17} />
                </span>
                <span>
                  <b>{r.config_snapshot?.query || "Research run"}</b>
                  <small>{date(r.created_at)}</small>
                </span>
                <Badge value={r.status} />
              </Link>
            ))
          ) : (
            <div className="small-empty">No research runs yet.</div>
          )}
        </section>
        <section className="card">
          <div className="card-heading">
            <h2>Project workspace</h2>
            <Link to="/projects" className="text-link">
              View all
              <ArrowRight size={14} />
            </Link>
          </div>
          {d.projects.items.length ? (
            d.projects.items.slice(0, 4).map((p: any) => (
              <Link
                key={p.id}
                to={"/projects/" + p.id}
                className="activity-row"
              >
                <span className="activity-icon">
                  <FolderKanban size={17} />
                </span>
                <span>
                  <b>{p.name}</b>
                  <small>{date(p.updated_at)}</small>
                </span>
                <Badge value={p.status} />
              </Link>
            ))
          ) : (
            <div className="small-empty">
              Choose GO on an idea to create your first blueprint.
            </div>
          )}
        </section>
      </div>
      {research && <ResearchDialog onClose={() => setResearch(false)} />}
    </>
  );
}
