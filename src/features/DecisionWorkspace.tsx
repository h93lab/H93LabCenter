import { useState, type FormEvent } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api, date, human, money, type Row } from "../lib/client";
import { Badge, Dialog, Empty, ErrorBox } from "../components/ui";

import { StructuredDetails } from "../components/BlueprintDetails";
export function MarketComparison({ data }: { data: Row }) {
  return (
    <section className="card">
      <div className="card-heading">
        <h2>Market comparison</h2>
        <p>
          Each row pairs one recommendation with its own score and confidence.
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Market</th>
              <th>Recommendation</th>
              <th>Score</th>
              <th>Confidence</th>
              <th>Model / rubric</th>
              <th>Analyzed</th>
            </tr>
          </thead>
          <tbody>
            {data.markets.map((m: Row) => (
              <tr key={m.recommendation.id}>
                <td>{m.market.name}</td>
                <td>
                  <Badge value={m.recommendation.status} />
                </td>
                <td>{m.score?.overall_score ?? "Unknown"}</td>
                <td>{m.confidence?.confidence ?? "Unknown"}</td>
                <td>
                  {m.model?.model_key || "Unknown"} {m.model?.version} /{" "}
                  {m.score?.factors?.rubric_version || "1.0"}
                </td>
                <td>{date(m.recommendation.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.markets.length && <Empty title="No market assessments yet" />}
    </section>
  );
}
export function CompetitorMatrix({ data }: { data: Row }) {
  return (
    <section className="card">
      <div className="card-heading">
        <h2>Sourced competitor comparison</h2>
        <p>
          Unknown values stay unknown. Changes require comparable source
          samples.
        </p>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Competitor</th>
              <th>Market / platform</th>
              <th>Price / monetization</th>
              <th>Rating / reviews</th>
              <th>Features / languages</th>
              <th>Source / date</th>
            </tr>
          </thead>
          <tbody>
            {data.matrix.map((c: Row) => (
              <tr key={c.id}>
                <td>
                  <b>{c.canonical_name}</b>
                  <Badge value={c.relation?.relation} />
                </td>
                <td>
                  {c.market?.code || "Unknown"}
                  <br />
                  {c.latest?.platform || "Unknown"}
                </td>
                <td>
                  {c.latest?.price_summary ?? "Unknown"}
                  <br />
                  {c.latest?.monetization_summary ?? "Unknown"}
                </td>
                <td>
                  {c.latest?.rating ?? "Unknown"} /{" "}
                  {c.latest?.review_count ?? "Unknown"}
                </td>
                <td>
                  <StructuredDetails
                    value={{
                      features: c.latest?.features || "Unknown",
                      languages: c.latest?.languages?.length
                        ? c.latest.languages
                        : "Unknown",
                    }}
                  />
                </td>
                <td>
                  {c.source ? (
                    <a
                      href={c.source.canonical_url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Open evidence
                    </a>
                  ) : (
                    "No confirmed snapshot source"
                  )}
                  <br />
                  {date(c.latest?.captured_at)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.matrix.length && <Empty title="No sourced competitors yet" />}
      {data.matrix
        .filter((c: Row) => c.changes.length)
        .map((c: Row) => (
          <details className="prose-card" key={c.id}>
            <summary>
              {c.canonical_name}: {c.changes.length} observed changes
            </summary>
            {c.changes.map((change: Row) => (
              <article key={change.field}>
                <h3>{human(change.field)}</h3>
                <StructuredDetails
                  value={{ before: change.before, after: change.after }}
                />
                <p>
                  <a
                    href={change.before_source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Earlier sample
                  </a>{" "}
                  · {date(change.before_at)} →{" "}
                  <a
                    href={change.after_source}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Later sample
                  </a>{" "}
                  · {date(change.after_at)}
                </p>
              </article>
            ))}
          </details>
        ))}
    </section>
  );
}
export function EvidenceCoverage({
  data,
  onEvidence,
}: {
  data: Row;
  onEvidence: (value: Row) => void;
}) {
  return (
    <>
      <section className="card">
        <div className="card-heading">
          <h2>Source coverage</h2>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evidence</th>
                <th>Requested market</th>
                <th>Observed market</th>
                <th>Language / origin</th>
                <th>Limitations</th>
              </tr>
            </thead>
            <tbody>
              {data.coverage.map((c: Row) => (
                <tr key={c.id}>
                  <td>
                    <button
                      className="text-link"
                      onClick={() =>
                        onEvidence(
                          data.evidence.find((e: Row) => e.id === c.id),
                        )
                      }
                    >
                      {c.title}
                    </button>
                  </td>
                  <td>{c.requested_market}</td>
                  <td>{c.observed_market}</td>
                  <td>
                    {c.language}
                    <br />
                    {human(c.origin)}
                  </td>
                  <td>{c.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section className="card prose-card">
        <h2>Claims and their evidence</h2>
        {data.claims.map((c: Row) => (
          <article key={c.id}>
            <h3>{c.claim_text || c.statement || c.title}</h3>
            {c.links.map((l: Row) => (
              <p key={l.evidence_id + l.relation}>
                <Badge value={l.relation} />{" "}
                <button
                  className="text-link"
                  disabled={!l.evidence}
                  onClick={() => onEvidence(l.evidence)}
                >
                  {l.evidence?.title || "Evidence unavailable"}
                </button>{" "}
                {l.rationale}
              </p>
            ))}
          </article>
        ))}
        {!data.claims.length && <p>No claims linked to this evidence yet.</p>}
      </section>
    </>
  );
}
export function ValidationPanel({ id, data }: { id: string; data: Row }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const save = useMutation({
    mutationFn: (body: Row) => api(`/ideas/${id}/validations`, "POST", body),
    onSuccess: () => {
      qc.invalidateQueries();
      setOpen(false);
      setRequestKey(crypto.randomUUID());
    },
  });
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const f = new FormData(event.currentTarget);
    save.mutate({
      request_key: requestKey,
      question: f.get("question"),
      method: f.get("method"),
      success_criterion: f.get("criterion"),
      estimated_hours: Number(f.get("hours")),
      estimated_cost_usd: Number(f.get("cost")),
      outcome: f.get("outcome"),
      result: f.get("result"),
      evidence_ids: f.getAll("evidence"),
      observed_at: new Date().toISOString(),
    });
  }
  return (
    <section className="card prose-card">
      <div className="card-heading">
        <h2>Next validation step</h2>
        <button className="button primary" onClick={() => setOpen(true)}>
          Record validation
        </button>
      </div>
      <p>
        {data.next_step?.question ||
          "Choose the assumption that could change your decision."}
      </p>
      <p className="muted">
        Define a method, success criterion, time and cost before testing.
        Completed outcomes need linked evidence. Records do not automatically
        change scores.
      </p>
      {data.validations.map((v: Row) => (
        <article key={v.id}>
          <h3>{v.question}</h3>
          <Badge value={v.outcome} />
          <p>{v.method}</p>
          <p>
            <b>Success criterion:</b> {v.success_criterion}
          </p>
          <p>
            {v.estimated_hours} hours · {money(v.estimated_cost_usd)} ·{" "}
            {date(v.observed_at)}
          </p>
          {v.result && <p>{v.result}</p>}
        </article>
      ))}
      {open && (
        <Dialog title="Record a validation" onClose={() => setOpen(false)} wide>
          <form onSubmit={submit}>
            <label>
              Question
              <input
                name="question"
                required
                maxLength={500}
                defaultValue={data.next_step?.question || ""}
              />
            </label>
            <label>
              Method
              <textarea name="method" required maxLength={1000} />
            </label>
            <label>
              Success criterion
              <textarea name="criterion" required maxLength={1000} />
            </label>
            <div className="two-column">
              <label>
                Estimated hours
                <input
                  name="hours"
                  type="number"
                  min="0"
                  max="1000"
                  step="0.25"
                  defaultValue="1"
                  required
                />
              </label>
              <label>
                Estimated cost (USD)
                <input
                  name="cost"
                  type="number"
                  min="0"
                  max="100000"
                  step="0.01"
                  defaultValue="0"
                  required
                />
              </label>
            </div>
            <label>
              Outcome
              <select name="outcome">
                <option value="planned">Planned</option>
                <option value="supported">Supported</option>
                <option value="rejected">Rejected</option>
                <option value="inconclusive">Inconclusive</option>
              </select>
            </label>
            <label>
              Result
              <textarea name="result" maxLength={4000} />
            </label>
            <fieldset>
              <legend>
                Supporting evidence (required for completed outcomes)
              </legend>
              {data.evidence.map((e: Row) => (
                <label className="checkbox" key={e.id}>
                  <input type="checkbox" name="evidence" value={e.id} />
                  {e.title}
                </label>
              ))}
            </fieldset>
            {save.error && <ErrorBox error={save.error} />}
            <div className="dialog-actions">
              <button className="button primary" disabled={save.isPending}>
                {save.isPending ? "Saving…" : "Save validation"}
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </section>
  );
}
export function ReviewImportDialog({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [body, setBody] = useState<Row | null>(null);
  const [content, setContent] = useState("");
  const [fileError, setFileError] = useState<unknown>(null);
  const [key] = useState(() => crypto.randomUUID());
  const preview = useMutation({
    mutationFn: (input: Row) => api("/evidence/import/preview", "POST", input),
  });
  const save = useMutation({
    mutationFn: () =>
      api(`/ideas/${id}/evidence/import`, "POST", {
        ...body,
        request_key: key,
      }),
    onSuccess: () => qc.invalidateQueries(),
  });
  function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const input = {
      format: f.get("format"),
      content,
      source_name: f.get("name"),
      source_url: f.get("url"),
      market: String(f.get("market")).toUpperCase(),
      platform: f.get("platform"),
      language: f.get("language"),
      sampled_at: new Date(String(f.get("sampled_at"))).toISOString(),
      confirmed_real_reviews: f.get("real") === "on",
      dataset_kind: "real",
    };
    setBody(input);
    preview.mutate(input);
  }
  return (
    <Dialog title="Import sourced reviews" onClose={onClose} wide>
      {save.isSuccess ? (
        <div className="prose-card">
          <h3>Import complete</h3>
          <p>
            {save.data.imported} imported · {save.data.duplicates} duplicates
            skipped.
          </p>
          <p>{save.data.note}</p>
          <button className="button primary" onClick={onClose}>
            Done
          </button>
        </div>
      ) : (
        <>
          <p>
            Import up to 100 reviews from a source you can identify. Your
            confirmation is recorded; it is not independent verification.
          </p>
          <p className="muted">
            Required CSV columns / JSON fields: external_id, text, published_at
            (ISO UTC), url, app_id. Optional: title, rating (0–5).
          </p>
          <form
            onSubmit={submit}
            onChange={() => {
              preview.reset();
              setBody(null);
            }}
          >
            <div className="two-column">
              <label>
                Format
                <select name="format" aria-label="Format">
                  <option value="csv">CSV</option>
                  <option value="json">JSON array</option>
                </select>
              </label>
              <label>
                Choose file
                <input
                  type="file"
                  accept=".csv,.json,text/csv,application/json"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 500000) {
                      setFileError(Error("File must be at most 500 KB"));
                      return;
                    }
                    setFileError(null);
                    setContent(await file.text());
                  }}
                />
              </label>
            </div>
            <label>
              Review content
              <textarea
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
              />
            </label>
            <div className="two-column">
              <label>
                Source name
                <input name="name" required minLength={2} maxLength={120} />
              </label>
              <label>
                Source URL
                <input name="url" type="url" placeholder="https://…" required />
              </label>
              <label>
                Market country code
                <input
                  name="market"
                  pattern="[A-Za-z]{2}"
                  placeholder="US"
                  required
                />
              </label>
              <label>
                Platform
                <select name="platform">
                  <option value="ios">iOS</option>
                  <option value="android">Android</option>
                  <option value="web">Web</option>
                  <option value="other">Other</option>
                </select>
              </label>
              <label>
                Language code
                <input name="language" defaultValue="und" required />
              </label>
              <label>
                Sample collected at
                <input name="sampled_at" type="datetime-local" required />
              </label>
            </div>
            <label className="checkbox">
              <input name="real" type="checkbox" required />
              These are real user reviews, and I have permission to use this
              sample.
            </label>
            <button className="button" disabled={preview.isPending}>
              {preview.isPending ? "Checking…" : "Preview import"}
            </button>
          </form>
          {(fileError || preview.error || save.error) && (
            <ErrorBox error={fileError || preview.error || save.error} />
          )}{" "}
          {preview.data && body && (
            <section className="prose-card">
              <h3>{preview.data.count} reviews ready</h3>
              <p>{preview.data.note}</p>
              {preview.data.sample.map((r: Row) => (
                <blockquote key={r.external_id}>
                  <b>{r.title || r.app_id}</b>
                  <p>{r.text}</p>
                </blockquote>
              ))}
              <button
                className="button primary"
                disabled={save.isPending}
                onClick={() => save.mutate()}
              >
                {save.isPending ? "Importing…" : "Import reviewed sample"}
              </button>
            </section>
          )}
        </>
      )}
    </Dialog>
  );
}
