import { useState } from "react";
import {
  useParams,
  Link,
  useLocation,
  useNavigate,
  useSearchParams,
} from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  ArrowLeft,
  ArrowRight,
  Download,
  CheckCircle2,
  FileText,
  GitBranch,
  MessageSquare,
  Smartphone,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { api, date, human, type Row } from "../lib/client";
import {
  BlueprintDiff,
  StructuredDetails,
} from "../components/BlueprintDetails";
import { artifactDiff } from "../components/blueprint-diff";
import {
  PageHeader,
  Badge,
  Loading,
  ErrorBox,
  Dialog,
  Empty,
  Tabs,
} from "../components/ui";

function download(data: unknown, name: string) {
  const u = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const a = document.createElement("a");
  a.href = u;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(u), 1000);
}
export default function Project() {
  const { id } = useParams(),
    qc = useQueryClient();
  const location = useLocation(),
    navigate = useNavigate();
  const [params] = useSearchParams();
  const tabs = [
    "Overview",
    "Documents",
    "Requirements",
    "Features",
    "Screens",
    "Rules",
    "Tasks",
    "Prototype",
    "Changes",
    "Versions",
  ];
  const routeTab = location.pathname.split("/")[3] || "overview";
  const aliases: Record<string, string> = {
    blueprint: "documents",
    files: "documents",
    architecture: "documents",
    research: "documents",
    decisions: "documents",
  };
  const tab =
    tabs.find(
      (item) => item.toLowerCase() === (aliases[routeTab] || routeTab),
    ) || "";
  const selected = params.get("version") || "";
  const docPath =
    params.get("doc") ||
    (routeTab === "architecture"
      ? "technical/ARCHITECTURE.md"
      : routeTab === "research"
        ? "research/TRACEABILITY.md"
        : routeTab === "decisions"
          ? "product/DECISIONS.md"
          : "README.md");
  const changeView = (nextTab = tab, version = selected, doc = docPath) => {
    const next = new URLSearchParams();
    if (version) next.set("version", version);
    if (doc !== "README.md") next.set("doc", doc);
    navigate(
      `/projects/${id}/${nextTab.toLowerCase()}${next.size ? "?" + next : ""}`,
    );
  };
  const setTab = (value: string) => changeView(value);
  const setSelected = (value: string) => changeView(tab, value);
  const setDocPath = (value: string) =>
    changeView("Documents", selected, value);
  const [documentSearch, setDocumentSearch] = useState("");
  const [comparison, setComparison] = useState<{
    before: Row;
    after: Row;
  } | null>(null);
  const [modal, setModal] = useState<string | null>(null),
    [request, setRequest] = useState(""),
    [editedMarkdown, setEditedMarkdown] = useState(""),
    [entity, setEntity] = useState<Row | null>(null),
    [notice, setNotice] = useState("");
  const q = useQuery({
    queryKey: ["project", id],
    queryFn: () => api("/projects/" + id),
    refetchInterval: 4000,
  });
  const action = useMutation({
    mutationFn: async ({ op, body }: { op: string; body: Row }) =>
      api("/projects/" + id + "/" + op, "POST", body),
    onSuccess: (d, v) => {
      qc.invalidateQueries({ queryKey: ["project", id] });
      if (v.op === "fork") {
        setSelected("");
        setNotice("A new draft version is ready.");
      }
      if (v.op === "export") window.location.assign(d.url);
      if (v.op === "figma") download(d, "figma-handoff.json");
      if (v.op === "figma-receipt")
        setNotice("Figma receipt linked to this blueprint version.");
      if (v.op === "change") {
        setModal(null);
        setRequest("");
        setTab("Changes");
      }
      if (v.op === "validate")
        setNotice(
          d.mandatory_pass
            ? "All automated checks passed."
            : "Validation found blockers. Review the quality gates.",
        );
    },
  });
  const cancel = useMutation({
    mutationFn: (changeId: string) =>
      api("/changes/" + changeId + "/cancel", "POST", {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["project", id] }),
  });
  const apply = useMutation({
    mutationFn: (changeId: string) =>
      api("/changes/" + changeId + "/apply", "POST", {}),
    onSuccess: () => {
      setSelected("");
      qc.invalidateQueries({ queryKey: ["project", id] });
      setNotice("Change applied as a new draft version.");
    },
  });
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} retry={() => q.refetch()} />;
  const d = q.data!,
    p = d.project,
    v = d.versions.find(
      (x: Row) => x.id === (selected || p.current_blueprint_version_id),
    ),
    b = v?.manifest,
    report = d.quality
      .filter((x: Row) => x.blueprint_version_id === v?.id)
      .sort((a: Row, c: Row) => c.created_at.localeCompare(a.created_at))[0];
  const current = v?.id === p.current_blueprint_version_id;
  const doc =
    b?.documents.find((x: Row) => x.path === docPath) || b?.documents[0];
  const documentMissing =
    !!b && !b.documents.some((item: Row) => item.path === docPath);
  const entities = [
    "requirements",
    "features",
    "screens",
    "rules",
    "tasks",
    "events",
    "tests",
    "decisions",
  ].flatMap((family) => b?.[family] || []);
  const tracedKeys = new Set<string>(
    doc?.content_md.match(/\b[A-Z]+-\d+\b/g) || [],
  );
  const traced = entities.filter((item: Row) =>
    tracedKeys.has(item.stable_key),
  );
  const prototype = d.prototypes?.find(
    (item: Row) =>
      item.blueprint_version_id === v?.id && item.artifact_type === "internal",
  );
  const run = (op: string) => action.mutate({ op, body: { version_id: v.id } });
  if (!tab || (selected && !v))
    return (
      <Empty
        title="Blueprint view not found"
        text="This section or version is no longer available."
      >
        <Link className="button" to={`/projects/${id}`}>
          Open project overview
        </Link>
      </Empty>
    );
  const filteredDocuments = (b?.documents || []).filter((file: Row) =>
    file.path.toLowerCase().includes(documentSearch.toLowerCase()),
  );
  const documentGroups = [
    ...new Set<string>(
      filteredDocuments.map((file: Row) =>
        file.path.includes("/") ? file.path.split("/")[0] : "Project",
      ),
    ),
  ];
  return (
    <>
      <Link to="/projects" className="back-link">
        <ArrowLeft size={14} />
        Projects
      </Link>
      <PageHeader
        eyebrow="PROJECT BLUEPRINT"
        title={p.name}
        description="One coherent specification, from product decisions to development handoff."
      >
        <button
          className="button"
          disabled={!v || action.isPending || !current}
          onClick={() => setModal("change")}
        >
          <MessageSquare size={15} />
          Ask AI to change
        </button>
        <button
          className="button primary"
          disabled={
            !v ||
            action.isPending ||
            !["published", "superseded"].includes(v?.status)
          }
          onClick={() => run("export")}
        >
          <Download size={15} />
          Export package
        </button>
      </PageHeader>
      <div className="idea-meta">
        <Badge value={p.status} />
        {v && (
          <>
            <select
              aria-label="Blueprint version"
              value={v.id}
              onChange={(e) => setSelected(e.target.value)}
            >
              {d.versions.map((x: Row) => (
                <option key={x.id} value={x.id}>
                  Version {x.version_number} · {human(x.status)}
                </option>
              ))}
            </select>
            <Badge value={v.status} />
            <span>
              Quality {v.quality_score ?? "Unknown"}
              {v.quality_score != null ? " / 100" : ""}
            </span>
            <Badge value={`Prototype ${prototype?.status || "pending"}`} />
          </>
        )}
        <span>Updated {date(p.updated_at)}</span>
        <Link className="text-link" to={"/ideas/" + p.concept_id}>
          Source idea
          <ArrowRight size={14} />
        </Link>
      </div>
      {action.error && <ErrorBox error={action.error} />}{" "}
      {apply.error && <ErrorBox error={apply.error} />}{" "}
      {cancel.error && <ErrorBox error={cancel.error} />}{" "}
      {notice && (
        <div className="callout" role="status">
          {notice}
        </div>
      )}
      {!b ? (
        <section className="card">
          <Empty
            title="Your blueprint is taking shape"
            text="The durable pipeline is defining the product, planning screens and flows, and assembling implementation tasks. Progress and any errors appear in the job monitor."
          >
            <Link className="button" to="/research/jobs">
              View jobs
              <ArrowRight size={14} />
            </Link>
          </Empty>
        </section>
      ) : (
        <>
          <Tabs
            items={tabs}
            value={tab}
            onChange={setTab}
            label="Blueprint sections"
            idPrefix="blueprint"
          />
          <div
            role="tabpanel"
            id="blueprint-panel"
            aria-labelledby={`blueprint-tab-${tab.toLowerCase()}`}
            tabIndex={0}
          >
            {tab === "Overview" && (
              <>
                <div className="two-column">
                  <section className="card prose-card">
                    <h2>Product direction</h2>
                    <p>{b.product.mission}</p>
                    <h3>For whom</h3>
                    <p>{b.product.audience}</p>
                    <h3>Differentiation</h3>
                    <p>{b.product.wedge}</p>
                    <h3>Approved scope</h3>
                    <ul>
                      {b.product.scope.map((s: string) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                    <h3>Outside this version</h3>
                    <ul>
                      {b.product.non_goals.map((s: string) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </section>
                  <section className="card">
                    <div className="card-heading">
                      <h2>Blueprint coverage</h2>
                      <GitBranch size={17} />
                    </div>
                    {[
                      ["Research snapshot", !!p.frozen_research_snapshot],
                      ["Product & requirements", b.requirements.length > 0],
                      ["UX & flows", b.screens.length > 0],
                      ["Implementation plan", b.tasks.length > 0],
                      ["Clickable prototype", !!b.prototype],
                      ["Quality gates", report?.mandatory_pass],
                      ["Published handoff", v.status === "published"],
                    ].map(([name, ok]) => (
                      <div key={String(name)} className="setting-row">
                        <span>{name}</span>
                        <Badge value={ok ? "complete" : "pending"} />
                      </div>
                    ))}
                    <div className="prose-card">
                      <p>
                        {b.requirements.length} requirements ·{" "}
                        {b.screens.length} screens · {b.tasks.length} tasks ·{" "}
                        {b.documents.length} documents
                      </p>
                    </div>
                  </section>
                </div>
                <section className="card">
                  <div className="card-heading">
                    <div>
                      <h2>
                        <ShieldCheck size={17} /> Quality gates
                      </h2>
                      <p>Mandatory failures block publication.</p>
                    </div>
                    <div className="actions">
                      <button
                        className="button"
                        disabled={!current || action.isPending}
                        onClick={() => run("validate")}
                      >
                        Validate
                      </button>
                      <button
                        className="button primary"
                        disabled={
                          !current ||
                          !report?.mandatory_pass ||
                          action.isPending ||
                          v.status === "published"
                        }
                        onClick={() => run("publish")}
                      >
                        <CheckCircle2 size={16} />
                        Ready for development
                      </button>
                    </div>
                  </div>
                  {report?.gates.map((g: Row) => (
                    <div className="quality-row" key={g.id}>
                      <span className={g.pass ? "gate-pass" : "gate-fail"}>
                        {g.pass ? "✓" : "!"}
                      </span>
                      <div>
                        <b>
                          {g.id} · {g.name}
                        </b>
                        <p>{g.reason}</p>
                      </div>
                      <Badge value={g.pass ? "passed" : "blocked"} />
                    </div>
                  )) || <Empty title="Validation pending" />}
                </section>
              </>
            )}
            {tab === "Documents" && documentMissing && (
              <Empty
                title="Document not in this version"
                text="Choose another document or version to continue reviewing."
              >
                <button
                  className="button"
                  onClick={() => setDocPath("README.md")}
                >
                  Open project README
                </button>
              </Empty>
            )}
            {tab === "Documents" && !documentMissing && (
              <section className="card document-workspace">
                <nav className="document-tree" aria-label="Blueprint documents">
                  <label className="document-search">
                    Find a document
                    <input
                      value={documentSearch}
                      onChange={(event) =>
                        setDocumentSearch(event.target.value)
                      }
                      placeholder="Search files…"
                    />
                  </label>
                  {documentGroups.map((group) => (
                    <div key={group}>
                      <h3 className="document-group">{human(group)}</h3>
                      {filteredDocuments
                        .filter(
                          (file: Row) =>
                            (file.path.includes("/")
                              ? file.path.split("/")[0]
                              : "Project") === group,
                        )
                        .map((f: Row) => (
                          <button
                            className={f.path === doc.path ? "active" : ""}
                            aria-current={
                              f.path === doc.path ? "page" : undefined
                            }
                            key={f.path}
                            onClick={() => setDocPath(f.path)}
                          >
                            <FileText size={14} />
                            <span>{f.path}</span>
                          </button>
                        ))}
                    </div>
                  ))}
                  {!filteredDocuments.length && (
                    <p className="small-empty">No matching documents.</p>
                  )}
                </nav>
                <article className="document-preview">
                  <div className="card-heading">
                    <span className="mono">{doc.path}</span>
                    <div className="actions">
                      <Badge value={v.status} />
                      {v.status === "draft" ? (
                        <button
                          className="button small"
                          onClick={() => {
                            setEditedMarkdown(doc.content_md);
                            setModal("edit-document");
                          }}
                        >
                          Edit draft
                        </button>
                      ) : (
                        current && (
                          <button
                            className="button small"
                            disabled={action.isPending}
                            onClick={() => run("fork")}
                          >
                            Create editable version
                          </button>
                        )
                      )}
                    </div>
                  </div>
                  <div className="document-metadata">
                    <span>
                      {v.status === "draft"
                        ? "Editable through a reviewed change"
                        : "Immutable published content"}
                    </span>
                    <span>
                      Version {v.version_number} ·{" "}
                      {doc.content_md.length.toLocaleString()} characters
                    </span>
                  </div>
                  {!!traced.length && (
                    <div className="document-trace">
                      <b>Traced entities</b>
                      <div className="actions">
                        {traced.map((item: Row) => (
                          <button
                            className="button small mono"
                            key={item.stable_key}
                            onClick={() => setEntity(item)}
                          >
                            {item.stable_key}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="markdown">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {doc.content_md}
                    </ReactMarkdown>
                  </div>
                </article>
              </section>
            )}
            {["Requirements", "Features", "Screens", "Rules", "Tasks"].includes(
              tab,
            ) && (
              <section className="card">
                <div className="card-heading">
                  <h2>{tab}</h2>
                  <span className="muted">
                    Stable IDs · Version {v.version_number}
                  </span>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>{tab === "Screens" ? "Screen" : "Title"}</th>
                        <th>Purpose</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {b[tab.toLowerCase()].map((e: Row) => (
                        <tr key={e.stable_key}>
                          <td className="mono">{e.stable_key}</td>
                          <td>
                            <button
                              className="plain title-link"
                              onClick={() => setEntity(e)}
                            >
                              {e.title || e.name}
                            </button>
                          </td>
                          <td>
                            {e.objective ||
                              e.purpose ||
                              e.outcome ||
                              e.condition_text ||
                              e.requirement_text}
                          </td>
                          <td>
                            <button
                              className="icon-button"
                              aria-label={"Inspect " + e.stable_key}
                              onClick={() => setEntity(e)}
                            >
                              <ArrowRight size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            )}
            {tab === "Prototype" && (
              <Prototype
                key={v.id}
                bundle={b}
                onFigma={() => run("figma")}
                onReceipt={(receipt) =>
                  action.mutate({ op: "figma-receipt", body: receipt })
                }
              />
            )}
            {tab === "Changes" && (
              <section className="card">
                <div className="card-heading">
                  <h2>Controlled AI changes</h2>
                  <button
                    className="button"
                    disabled={!current}
                    onClick={() => setModal("change")}
                  >
                    New change
                  </button>
                </div>
                {d.changes.length ? (
                  d.changes.map((c: Row) => (
                    <article className="change-card" key={c.id}>
                      <div className="card-heading">
                        <h3>{c.request_text}</h3>
                        <Badge value={c.status} />
                      </div>
                      <small>{date(c.requested_at)}</small>
                      {c.impact_summary?.impacts && (
                        <>
                          <p>
                            {c.impact_summary.impacts.length} artifacts
                            affected. Applying creates a new draft and
                            regenerates the prototype.
                          </p>
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Artifact</th>
                                  <th>Action</th>
                                  <th>Risk</th>
                                  <th>Reason</th>
                                </tr>
                              </thead>
                              <tbody>
                                {c.impact_summary.impacts.map((i: Row) => (
                                  <tr
                                    key={
                                      (i.artifact_kind || "document") +
                                      i.artifact_key
                                    }
                                  >
                                    <td className="mono">{i.artifact_key}</td>
                                    <td>
                                      <Badge value={i.action} />
                                    </td>
                                    <td>{i.risk || "Review"}</td>
                                    <td>
                                      {i.reason ||
                                        "Affected by requested product change"}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                          {c.status === "impact_ready" && (
                            <div className="dialog-actions">
                              <button
                                className="button"
                                disabled={cancel.isPending}
                                onClick={() => cancel.mutate(c.id)}
                              >
                                Cancel change
                              </button>
                              <button
                                className="button"
                                onClick={() => setEntity(c.impact_summary)}
                              >
                                Inspect proposed changes
                              </button>
                              <button
                                className="button primary"
                                disabled={
                                  apply.isPending ||
                                  c.base_blueprint_version_id !==
                                    p.current_blueprint_version_id
                                }
                                onClick={() => apply.mutate(c.id)}
                              >
                                Apply as new version
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </article>
                  ))
                ) : (
                  <Empty
                    title="Your change history starts here"
                    text="Ask for a product change, review its impact, then apply it to a new version."
                  />
                )}
              </section>
            )}
            {tab === "Versions" && (
              <section className="card">
                <div className="card-heading">
                  <h2>Version history</h2>
                  <span>{d.versions.length} versions</span>
                </div>
                {d.versions.map((version: Row, i: number) => {
                  const previous = d.versions[i + 1];
                  const changed = artifactDiff(
                    previous?.manifest || {},
                    version.manifest,
                    "documents",
                    "path",
                  );
                  return (
                    <article className="change-card" key={version.id}>
                      <div className="card-heading">
                        <h3>Version {version.version_number}</h3>
                        <Badge value={version.status} />
                      </div>
                      <p>
                        {version.change_summary || "Initial product blueprint"}
                      </p>
                      <small>
                        {date(version.created_at)} · {changed.length}{" "}
                        {previous ? "changed" : "created"} documents
                      </small>
                      <div className="actions">
                        <button
                          className="button small"
                          onClick={() => {
                            changeView("Documents", version.id);
                          }}
                        >
                          Inspect version
                        </button>
                        {previous && (
                          <button
                            className="button small"
                            onClick={() =>
                              setComparison({
                                before: previous,
                                after: version,
                              })
                            }
                          >
                            Compare documents
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </section>
            )}
          </div>
        </>
      )}
      {modal === "edit-document" && (
        <Dialog title={"Edit " + doc.path} onClose={() => setModal(null)} wide>
          <p>
            Your edit will be reconciled with the structured blueprint. Review
            all affected artifacts before applying.
          </p>
          <textarea
            className="mono"
            rows={18}
            value={editedMarkdown}
            onChange={(e) => setEditedMarkdown(e.target.value)}
            aria-label="Document Markdown"
          />
          <div className="dialog-actions">
            <button
              className="button primary"
              disabled={action.isPending || editedMarkdown === doc.content_md}
              onClick={() =>
                action.mutate({
                  op: "change",
                  body: {
                    base_version: v.id,
                    request:
                      "Update " +
                      doc.path +
                      " to reflect the following requested Markdown and reconcile all affected structured entities and documents.\n" +
                      editedMarkdown,
                  },
                })
              }
            >
              Analyze edit impact
            </button>
          </div>
          {action.error && <ErrorBox error={action.error} />}
        </Dialog>
      )}
      {modal === "change" && (
        <Dialog
          title="Ask AI to change the blueprint"
          onClose={() => setModal(null)}
        >
          <p>
            Describe the outcome. AI will propose changes across requirements,
            screens, rules, tasks and documents for your review.
          </p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              action.mutate({
                op: "change",
                body: { request, base_version: v.id },
              });
            }}
          >
            <label>
              Requested change
              <textarea
                required
                minLength={5}
                maxLength={12000}
                rows={6}
                value={request}
                onChange={(e) => setRequest(e.target.value)}
                placeholder="For example: replace subscriptions with a lifetime purchase, including restore purchases and all affected screens."
              />
            </label>
            {action.error && <ErrorBox error={action.error} />}
            <div className="dialog-actions">
              <button className="button primary" disabled={action.isPending}>
                {action.isPending ? "Submitting…" : "Analyze impact"}
                <ArrowRight size={15} />
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {comparison && (
        <Dialog
          title={`Blueprint changes · ${comparison.before.version_number} to ${comparison.after.version_number}`}
          onClose={() => setComparison(null)}
          wide
        >
          <BlueprintDiff before={comparison.before} after={comparison.after} />
        </Dialog>
      )}
      {entity && (
        <Dialog
          title={entity.stable_key || "Change details"}
          onClose={() => setEntity(null)}
          wide
        >
          <StructuredDetails
            value={entity}
            onReference={(key) => {
              const match = entities.find(
                (item: Row) => item.stable_key === key,
              );
              if (match) setEntity(match);
            }}
          />
        </Dialog>
      )}
    </>
  );
}
function Prototype({
  bundle,
  onFigma,
  onReceipt,
}: {
  bundle: Row;
  onFigma: () => void;
  onReceipt: (receipt: Row) => void;
}) {
  const [device, setDevice] = useState("iphone");
  const [screen, setScreen] = useState(bundle.screens[0].stable_key),
    [state, setState] = useState("default"),
    [history, setHistory] = useState<string[]>([]),
    [feedback, setFeedback] = useState("");
  const s =
    bundle.screens.find((x: Row) => x.stable_key === screen) ||
    bundle.screens[0];
  const go = (id: string) => {
    if (bundle.screens.some((x: Row) => x.stable_key === id)) {
      setHistory((h) => [...h, screen]);
      setScreen(id);
      setState("default");
      setFeedback("");
    }
  };
  return (
    <div className="prototype-workspace">
      <section className="card prototype-controls">
        <div className="card-heading">
          <h2>
            <Smartphone size={17} /> Interactive prototype
          </h2>
        </div>
        <div className="prose-card">
          <label>
            Device preview
            <select
              aria-label="Device preview"
              value={device}
              onChange={(event) => setDevice(event.target.value)}
            >
              <option value="iphone">iPhone portrait</option>
              <option value="android">Android portrait</option>
              <option value="responsive">Responsive · no device frame</option>
            </select>
          </label>
          <label>
            Screen
            <select
              aria-label="Screen"
              value={screen}
              onChange={(e) => go(e.target.value)}
            >
              {bundle.screens.map((x: Row) => (
                <option key={x.stable_key} value={x.stable_key}>
                  {x.stable_key} · {x.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Screen state
            <select
              aria-label="Screen state"
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              {Object.keys(s.states).map((k) => (
                <option key={k}>{k}</option>
              ))}
            </select>
          </label>
          <p className="muted">{s.purpose}</p>
          <h3>Navigation</h3>
          {s.navigation.map((id: string) => (
            <button key={id} className="button small" onClick={() => go(id)}>
              {bundle.screens.find((x: Row) => x.stable_key === id)?.name}
              <ArrowRight size={13} />
            </button>
          ))}
          <h3>Handoff to Figma</h3>
          <p>
            Download this version’s screen model, then import it with the H93Lab
            plugin to create editable frames.
          </p>
          <button className="button" onClick={onFigma}>
            <Download size={14} />
            Figma JSON
          </button>
          <a className="text-link" href="/figma-plugin.zip" download>
            Download plugin
          </a>
          <label>
            Import Figma receipt
            <input
              type="file"
              accept=".json,application/json"
              onChange={async (e) => {
                try {
                  const file = e.target.files?.[0];
                  if (file) onReceipt(JSON.parse(await file.text()));
                } catch {
                  setFeedback("Invalid receipt JSON.");
                }
              }}
            />
          </label>
        </div>
      </section>
      <div className="prototype-stage">
        <div
          className={`phone-frame device-${device}`}
          aria-label={`${device === "responsive" ? "Responsive" : device === "android" ? "Android" : "iPhone"} prototype`}
        >
          <div className="phone-status">
            <b>9:41</b>
            <span>● ▰</span>
          </div>
          <header>
            <button
              className="icon-button"
              aria-label="Back in prototype"
              disabled={!history.length}
              onClick={() => {
                setScreen(history[history.length - 1]);
                setHistory((h) => h.slice(0, -1));
                setState("default");
              }}
            >
              <ArrowLeft size={17} />
            </button>
            <b>{s.name}</b>
            <button
              className="icon-button"
              aria-label="Reset prototype"
              onClick={() => {
                setScreen(bundle.screens[0].stable_key);
                setHistory([]);
                setState("default");
              }}
            >
              <RotateCcw size={15} />
            </button>
          </header>
          <div className="phone-content">
            {state !== "default" ? (
              <div className="prototype-state">
                <Badge value={state} />
                <p>{s.states[state]}</p>
                <button className="button" onClick={() => setState("default")}>
                  Return to default
                </button>
              </div>
            ) : (
              s.components.map((c: Row, i: number) =>
                c.type === "heading" ? (
                  <h2 key={i}>{c.text}</h2>
                ) : c.type === "button" ? (
                  <button
                    className="button primary"
                    key={i}
                    onClick={() =>
                      c.target
                        ? go(c.target)
                        : setFeedback(c.text + " — preview action complete")
                    }
                  >
                    {c.text}
                  </button>
                ) : c.type === "input" ? (
                  <label key={i}>
                    {c.text}
                    <input placeholder={c.text} />
                  </label>
                ) : c.type === "card" || c.type === "list" ? (
                  <div className="prototype-card" key={i}>
                    {c.text}
                  </div>
                ) : (
                  <p key={i}>{c.text}</p>
                ),
              )
            )}
            {feedback && (
              <p role="status" className="callout">
                {feedback}
              </p>
            )}
          </div>
          <div className="phone-home" />
        </div>
        <p className="muted">
          {s.stable_key} · Functional specification preview
        </p>
      </div>
    </div>
  );
}
