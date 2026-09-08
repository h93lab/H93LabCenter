import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Eye,
  FileText,
  ExternalLink,
  ShieldCheck,
  Target,
  Globe2,
  Clock3,
} from "lucide-react";
import { api, date, human, type Row } from "../lib/client";
import {
  PageHeader,
  Score,
  Badge,
  Loading,
  ErrorBox,
  Dialog,
  Empty,
} from "../components/ui";
export default function Idea() {
  const { id } = useParams();
  const nav = useNavigate(),
    qc = useQueryClient();
  const [tab, setTab] = useState("Analysis"),
    [modal, setModal] = useState<string | null>(null),
    [evidence, setEvidence] = useState<Row | null>(null);
  const q = useQuery({
    queryKey: ["idea", id],
    queryFn: () => api("/ideas/" + id),
    refetchInterval: 5000,
  });
  const decision = useMutation({
    mutationFn: (disposition: string) =>
      api("/ideas/" + id + "/disposition", "POST", { disposition }),
    onSuccess: () => qc.invalidateQueries(),
  });
  const go = useMutation({
    mutationFn: () =>
      api("/ideas/" + id + "/go", "POST", { request_key: crypto.randomUUID() }),
    onSuccess: (d) => {
      qc.invalidateQueries();
      nav("/projects/" + d.id);
    },
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} retry={() => q.refetch()} />;
  const d = q.data!;
  const score = d.scores[0],
    rec = d.recommendations[0],
    confidence = d.confidence.find(
      (c: Row) => c.id === rec?.confidence_snapshot_id,
    ),
    analysis = score?.factors?.analysis;
  return (
    <>
      <Link to="/ideas" className="back-link">
        <ArrowLeft size={14} />
        Ideas library
      </Link>
      <PageHeader
        eyebrow={
          human(d.opportunity.app_or_game) +
          " · " +
          human(d.opportunity.opportunity_type)
        }
        title={d.concept.title}
        description={d.concept.value_proposition}
      >
        <button className="button" onClick={() => setModal("brief")}>
          <FileText size={15} />
          Executive brief
        </button>
        <button
          className="button primary"
          onClick={() => setModal("go")}
          disabled={!rec || rec.status === "KILLED"}
        >
          GO · Build blueprint
          <ArrowRight size={16} />
        </button>
      </PageHeader>
      <div className="idea-meta">
        <Badge value={rec?.status || "Awaiting analysis"} />
        <Badge value={d.concept.disposition} />
        <span>
          <Globe2 size={14} />
          {analysis?.market_code || "Global"}
        </span>
        <span>
          <Clock3 size={14} />
          {date(d.concept.last_analyzed_at)}
        </span>
        <div className="actions">
          <button
            className="button small"
            disabled={decision.isPending}
            onClick={() => decision.mutate("shortlisted")}
          >
            <Bookmark size={14} />
            Shortlist
          </button>
          <button
            className="button small"
            disabled={decision.isPending}
            onClick={() => decision.mutate("watching")}
          >
            <Eye size={14} />
            Watch
          </button>
          <button
            className="button small"
            disabled={decision.isPending}
            onClick={() => decision.mutate("passed")}
          >
            Pass
          </button>
        </div>
      </div>
      {decision.error && <ErrorBox error={decision.error} />}
      <div className="idea-score-grid">
        <div className="card">
          <Score
            value={
              score?.overall_score === undefined
                ? undefined
                : Number(score.overall_score)
            }
            onClick={() => setModal("score")}
          />
        </div>
        <div className="card">
          <Score
            value={
              confidence?.confidence === undefined
                ? undefined
                : Number(confidence.confidence)
            }
            label="Research confidence"
            onClick={() => setModal("confidence")}
          />
        </div>
        <div className="card evidence-stat">
          <span className="eyebrow">TRACEABLE RESEARCH</span>
          <strong>
            {d.evidence.length}
            <small> source items</small>
          </strong>
          <p>
            {d.competitors.length} competitors · {d.reviews.length} review
            clusters
          </p>
        </div>
      </div>
      <div className="tabs" role="tablist">
        {[
          "Analysis",
          "Competition",
          "User voice",
          "Evidence",
          "Risks",
          "History",
        ].map((t) => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={tab === t ? "active" : ""}
          >
            {t}
          </button>
        ))}
      </div>
      {tab === "Analysis" && (
        <>
          <div className="two-column">
            <section className="card prose-card">
              <h2>
                <Target size={18} />
                The opportunity
              </h2>
              <h3>Problem to solve</h3>
              <p>{d.opportunity.problem_statement}</p>
              <h3>Why now</h3>
              <p>{d.opportunity.why_now}</p>
              <h3>Target audience</h3>
              <p>{d.concept.target_user}</p>
              <h3>Job to be done</h3>
              <p>{d.opportunity.job_to_be_done}</p>
            </section>
            <section className="card prose-card">
              <h2>The product thesis</h2>
              <h3>Your wedge</h3>
              <p>{d.concept.wedge}</p>
              <h3>Recommended MVP</h3>
              <p>{d.concept.mvp_thesis}</p>
              <h3>Market gap</h3>
              <p>{analysis?.gap || "Deep analysis is pending."}</p>
            </section>
          </div>
          <section className="card">
            <div className="card-heading">
              <h2>Opportunity factors</h2>
              <button className="text-link" onClick={() => setModal("score")}>
                How this score works
                <ArrowRight size={14} />
              </button>
            </div>
            {score ? (
              <div className="factor-grid">
                {Object.entries(score.factors.values).map(([key, value]) => (
                  <button
                    key={key}
                    className="factor-item"
                    onClick={() => setModal("score")}
                  >
                    <span>{human(key)}</span>
                    <b>{String(value)}</b>
                    <div className="bar">
                      <i style={{ width: value + "%" }} />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <Empty
                title="Analysis is in progress"
                text="Factor scores appear once the evidence has been assessed."
              />
            )}
          </section>
          <div className="two-column">
            <section className="card prose-card">
              <h2>Monetization</h2>
              <p>
                {analysis?.monetization || "Unknown until analysis completes."}
              </p>
            </section>
            <section className="card prose-card">
              <h2>Distribution</h2>
              <p>
                {analysis?.distribution || "Unknown until analysis completes."}
              </p>
            </section>
          </div>
          <section className="card prose-card">
            <h2>Validate before you build</h2>
            {rec?.validation_priorities?.length ? (
              <ul>
                {rec.validation_priorities.map((x: string) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            ) : (
              <p className="muted">
                Validation priorities will follow the completed analysis.
              </p>
            )}
          </section>
        </>
      )}
      {tab === "Competition" && (
        <section className="card">
          <div className="card-heading">
            <h2>Competitor landscape</h2>
            <span className="muted">Direct · Indirect · Substitutes</span>
          </div>
          {d.competitors.length ? (
            d.competitors.map((c: Row) => (
              <div className="competitor-row" key={c.competitor_id}>
                <div>
                  <h3>{c.canonical_name}</h3>
                  <Badge value={c.relation} />
                  {/^https?:\/\//.test(c.website || "") && (
                    <a
                      className="text-link"
                      href={c.website}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Visit source
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <div>
                  <b>Strengths</b>
                  <ul>
                    {c.analysis.strengths?.map((s: string) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <b>Weaknesses / unknowns</b>
                  <ul>
                    {c.analysis.weaknesses?.map((s: string) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <small>Revenue / downloads</small>
                  <p>Unknown</p>
                  <small>Latest sourced rating</small>
                  <p>{c.snapshots[0]?.rating ?? "Unknown"}</p>
                </div>
              </div>
            ))
          ) : (
            <Empty
              title="No verified competitors yet"
              text="Competitor identities appear only when supported by collected evidence."
            />
          )}
        </section>
      )}
      {tab === "User voice" && (
        <section className="card">
          <div className="card-heading">
            <h2>Review intelligence</h2>
          </div>
          {d.reviews.length ? (
            d.reviews.map((r: Row) => (
              <article className="prose-card" key={r.id}>
                <h3>{r.theme}</h3>
                <Badge value={r.category} />
                <p>{r.summary}</p>
                <small>
                  {r.member_count} of {r.sample_size} analyzed items mentioned
                  this theme. This is a sample, not the whole market.
                </small>
              </article>
            ))
          ) : (
            <Empty
              title="No review sample collected"
              text="We won't infer user complaints from app descriptions or invent review percentages."
            />
          )}
        </section>
      )}
      {tab === "Evidence" && (
        <section className="card">
          <div className="card-heading">
            <h2>Evidence & provenance</h2>
            <span>{d.evidence.length} sources</span>
          </div>
          {d.evidence.map((e: Row) => (
            <button
              className="evidence-row"
              key={e.id}
              onClick={() => setEvidence(e)}
            >
              <span className="activity-icon">
                <FileText size={18} />
              </span>
              <span>
                <b>{e.title}</b>
                <small>{e.canonical_url}</small>
              </span>
              <Badge value={e.source_type} />
              <span>{date(e.collected_at)}</span>
              <ArrowRight size={16} />
            </button>
          ))}
        </section>
      )}
      {tab === "Risks" && (
        <>
          <section className="card prose-card">
            <h2>
              <ShieldCheck size={18} /> Kill criteria
            </h2>
            {d.risks.length ? (
              d.risks.map((r: Row) => (
                <div className="risk-row" key={r.id}>
                  <Badge value={r.result} />
                  <div>
                    <h3>{human(r.rule_key)}</h3>
                    <p>{r.rationale}</p>
                    <small>
                      {human(r.severity)} · Rule {r.rule_version}
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <p>Risk evaluation has not completed.</p>
            )}
          </section>
          <section className="card prose-card">
            <h2>Critical unknowns</h2>
            <ul>
              {analysis?.critical_unknowns?.map((u: string) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </section>
        </>
      )}
      {tab === "History" && (
        <section className="card">
          <div className="card-heading">
            <h2>Opportunity timeline</h2>
          </div>
          {d.timeline.map((t: Row) => (
            <div className="timeline-row" key={t.id}>
              <span className="status-dot" />
              <div>
                <b>{t.summary}</b>
                <small>{date(t.occurred_at)}</small>
              </div>
            </div>
          ))}
          {!d.timeline.length && <Empty title="No history yet" />}
        </section>
      )}
      {modal === "brief" && (
        <Dialog title="Executive brief" onClose={() => setModal(null)}>
          <Badge value={rec?.status || "Pending"} />
          <div className="prose-card">
            <p>{rec?.rationale || "Analysis is pending."}</p>
            <h3>Winning wedge</h3>
            <p>{d.concept.wedge}</p>
            <h3>Biggest risk</h3>
            <p>{rec?.biggest_risk || "Unknown"}</p>
            <h3>What to validate first</h3>
            <ul>
              {rec?.validation_priorities?.map((v: string) => (
                <li key={v}>{v}</li>
              ))}
            </ul>
          </div>
        </Dialog>
      )}
      {modal === "score" && (
        <Dialog title="Score explanation" onClose={() => setModal(null)} wide>
          <p className="muted">
            Deterministic weighted calculation. Each factor is an evidence-based
            assessment, not a measured market statistic.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Factor</th>
                  <th>Value</th>
                  <th>Weight</th>
                  <th>Contribution</th>
                  <th>Evidence rationale</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(score?.factors?.values || {}).map(([k, v]) => (
                  <tr key={k}>
                    <td>{human(k)}</td>
                    <td>{String(v)}</td>
                    <td>{score.factors.weights[k]}%</td>
                    <td>
                      {((Number(v) * score.factors.weights[k]) / 100).toFixed(
                        2,
                      )}
                    </td>
                    <td>{score.factors.assessments[k]?.rationale}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            Calculated {date(score?.calculated_at)} · Model{" "}
            {d.opportunity.app_or_game === "game" ? "GAME-1.0" : "APP-1.0"}
          </p>
        </Dialog>
      )}
      {modal === "confidence" && (
        <Dialog title="Research confidence" onClose={() => setModal(null)}>
          <p>
            Confidence describes evidence quality, not commercial
            attractiveness.
          </p>
          {Object.entries(confidence?.components || {}).map(([k, v]) => (
            <div className="setting-row" key={k}>
              <span>{human(k)}</span>
              <b>{String(v)} / 100</b>
            </div>
          ))}
        </Dialog>
      )}
      {modal === "go" && (
        <Dialog
          title="Turn this idea into a project?"
          onClose={() => setModal(null)}
        >
          <p>
            Freeze the current research and generate a complete Flutter-aware
            blueprint for <b>{d.concept.title}</b>.
          </p>
          <div className="callout">
            <Badge value={rec?.status} />
            <p>
              Opportunity score: {score?.overall_score} · Confidence:{" "}
              {confidence?.confidence}
            </p>
            <p>
              Your package will include requirements, screens, business rules,
              implementation tasks, tests and a clickable prototype.
            </p>
          </div>
          {go.error && <ErrorBox error={go.error} />}
          <div className="dialog-actions">
            <button className="button" onClick={() => setModal(null)}>
              Cancel
            </button>
            <button
              className="button primary"
              disabled={go.isPending}
              onClick={() => go.mutate()}
            >
              {go.isPending ? "Creating project…" : "Create blueprint"}
              <ArrowRight size={15} />
            </button>
          </div>
        </Dialog>
      )}
      {evidence && (
        <Dialog title={evidence.title} onClose={() => setEvidence(null)} wide>
          <Badge value={evidence.source_type} />
          <p className="muted">
            Collected {date(evidence.collected_at)} · Published{" "}
            {date(evidence.published_at)}
          </p>
          <p className="pre-wrap">{evidence.normalized_text}</p>
          <a
            className="text-link"
            href={
              /^https?:\/\//.test(evidence.canonical_url)
                ? evidence.canonical_url
                : undefined
            }
            target="_blank"
            rel="noreferrer"
          >
            Original source
            <ExternalLink size={14} />
          </a>
        </Dialog>
      )}
    </>
  );
}
