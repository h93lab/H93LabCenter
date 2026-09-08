import { useState, type FormEvent } from "react";
import { useLocation, Link } from "react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  Save,
  ExternalLink,
  Plus,
  SlidersHorizontal,
} from "lucide-react";
import { api, human, money, date, type Row } from "../lib/client";
import {
  PageHeader,
  Loading,
  ErrorBox,
  Badge,
  Dialog,
  Empty,
} from "../components/ui";
import {
  appWeights,
  gameWeights,
} from "../../supabase/functions/_shared/scoring";
export default function Settings() {
  const loc = useLocation(),
    qc = useQueryClient();
  const [error, setError] = useState<unknown>(null),
    [saved, setSaved] = useState(false),
    [editRole, setEditRole] = useState<Row | null>(null),
    [prompt, setPrompt] = useState(false);
  const aiPage = loc.pathname.startsWith("/ai");
  const section = loc.pathname.split("/").pop() || "research";
  const q = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api("/bootstrap"),
  });
  const usages = useQuery({
    queryKey: ["usage"],
    queryFn: () => api("/table/usage"),
    enabled: aiPage && section === "usage",
    refetchInterval: 5000,
  });
  const prompts = useQuery({
    queryKey: ["prompts"],
    queryFn: () => api("/table/prompts"),
    enabled: aiPage && section === "prompts",
  });
  const modelQuery = useQuery({
    queryKey: ["models"],
    queryFn: () => api<Row[]>("/models"),
    enabled: !!editRole,
  });
  async function save(path: string, body: Row, method = "PATCH") {
    setError(null);
    try {
      await api(path, method, body);
      qc.invalidateQueries();
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      return true;
    } catch (e) {
      setError(e);
      return false;
    }
  }
  if (q.isPending) return <Loading />;
  if (q.error) return <ErrorBox error={q.error} />;
  const d = q.data!,
    s = d.settings;
  const settingsTabs = [
    "research",
    "markets",
    "sources",
    "scoring",
    "development-profile",
    "figma",
    "integrations",
    "account",
  ];
  return (
    <>
      <PageHeader
        eyebrow={aiPage ? "AI CONTROL ROOM" : "WORKSPACE CONFIGURATION"}
        title={aiPage ? "AI & model settings" : "Workspace settings"}
        description={
          aiPage
            ? "Choose the right model for each job. Keep quality and cost visible."
            : "Tune your research, markets and development preferences."
        }
      >
        {saved && (
          <span className="saved">
            <Check size={16} />
            Saved
          </span>
        )}
      </PageHeader>
      <div className="tabs">
        {(aiPage ? ["models", "prompts", "usage"] : settingsTabs).map((t) => (
          <Link
            key={t}
            to={
              aiPage ? (t === "models" ? "/ai" : "/ai/" + t) : "/settings/" + t
            }
            className={
              section === t || (section === "ai" && t === "models")
                ? "active"
                : ""
            }
          >
            {human(t.replaceAll("-", " "))}
          </Link>
        ))}
      </div>
      {error && <ErrorBox error={error} />}
      {!aiPage && section === "research" && (
        <form
          className="card settings-form"
          key={s.updated_at}
          onSubmit={(e: FormEvent<HTMLFormElement>) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            save("/settings", {
              timezone: f.get("timezone"),
              daily_research_local_time: f.get("time"),
              daily_research_enabled: f.get("enabled") === "on",
              apps_allocation: Number(f.get("apps")),
              games_allocation: 100 - Number(f.get("apps")),
              daily_ai_budget_usd: Number(f.get("daily")),
              monthly_ai_budget_usd: Number(f.get("monthly")),
              max_deep_candidates: Number(f.get("candidates")),
              research_config: {
                query: f.get("query"),
                run_budget: Number(f.get("budget")),
                max_items: 12,
              },
            });
          }}
        >
          <div className="card-heading">
            <div>
              <h2>Research preferences</h2>
              <p>Quality, scope and cost controls for each run.</p>
            </div>
          </div>
          <div className="form-grid">
            <label>
              Default research focus
              <input
                name="query"
                defaultValue={s.research_config.query || "mobile productivity"}
                required
              />
            </label>
            <label>
              Timezone
              <input name="timezone" defaultValue={s.timezone} required />
            </label>
            <label>
              Daily local time
              <input
                name="time"
                type="time"
                defaultValue={s.daily_research_local_time.slice(0, 5)}
                required
              />
            </label>
            <label>
              Apps allocation (%)
              <input
                name="apps"
                type="number"
                min="0"
                max="100"
                defaultValue={s.apps_allocation}
              />
              <small>Remaining allocation goes to games.</small>
            </label>
            <label>
              Per-run budget (USD)
              <input
                name="budget"
                type="number"
                min="0"
                max="10"
                step="0.05"
                defaultValue={s.research_config.run_budget ?? 0.5}
              />
            </label>
            <label>
              Daily AI budget (USD)
              <input
                name="daily"
                type="number"
                min="0"
                max="100"
                step="0.1"
                defaultValue={s.daily_ai_budget_usd}
              />
            </label>
            <label>
              Monthly AI budget (USD)
              <input
                name="monthly"
                type="number"
                min="0"
                max="1000"
                defaultValue={s.monthly_ai_budget_usd}
              />
            </label>
            <label>
              Maximum deep candidates
              <input
                name="candidates"
                type="number"
                min="1"
                max="10"
                defaultValue={s.max_deep_candidates}
              />
            </label>
          </div>
          <label className="check-label">
            <input
              type="checkbox"
              name="enabled"
              defaultChecked={s.daily_research_enabled}
            />
            Enable daily scheduled research
          </label>
          <div className="form-footer">
            <button className="button primary">
              <Save size={15} />
              Save research settings
            </button>
          </div>
        </form>
      )}
      {!aiPage && section === "sources" && (
        <section className="card">
          <div className="card-heading">
            <h2>Source adapters</h2>
            <p>Unavailable adapters remain visible and never fabricate data.</p>
          </div>
          {d.sources.map((source: Row) => {
            const available = d.integrations.supported_sources.includes(
              source.key,
            );
            return (
              <div className="setting-row" key={source.id}>
                <div>
                  <b>{source.name}</b>
                  <small>
                    {human(source.source_type)} ·{" "}
                    {source.is_paid ? "Paid provider" : "Public / free"} · Last
                    success: {date(source.last_success_at)}
                  </small>
                  {source.last_error_code && (
                    <small className="form-error">
                      {human(source.last_error_code)}
                    </small>
                  )}
                </div>
                <Badge value={available ? "Available" : "Not configured"} />
                <input
                  type="checkbox"
                  aria-label={"Enable " + source.name}
                  checked={source.enabled}
                  disabled={!available}
                  onChange={(e) =>
                    save("/sources/" + source.id, { enabled: e.target.checked })
                  }
                />
              </div>
            );
          })}
        </section>
      )}
      {!aiPage && section === "markets" && (
        <section className="card">
          <div className="card-heading">
            <h2>Market priorities</h2>
            <p>Prioritize the countries that matter to your next build.</p>
          </div>
          {d.markets.map((m: Row) => {
            const p = d.preferences.find((x: Row) => x.market_id === m.id);
            return (
              <div className="setting-row" key={m.id}>
                <span className="market-code">{m.code}</span>
                <div>
                  <b>{m.name}</b>
                  <small>{m.region || "All markets"}</small>
                </div>
                <label className="inline-label">
                  Priority
                  <input
                    type="number"
                    aria-label={"Priority for " + m.name}
                    min="0"
                    max="100"
                    defaultValue={p?.priority || 50}
                    onBlur={(e) => {
                      if (Number(e.target.value) !== p?.priority)
                        save("/markets/" + m.id, {
                          enabled: p?.enabled ?? true,
                          priority: Number(e.target.value),
                        });
                    }}
                  />
                </label>
                <input
                  type="checkbox"
                  aria-label={"Enable " + m.name}
                  checked={p?.enabled ?? true}
                  onChange={(e) =>
                    save("/markets/" + m.id, {
                      enabled: e.target.checked,
                      priority: p?.priority || 50,
                    })
                  }
                />
              </div>
            );
          })}
        </section>
      )}
      {!aiPage && section === "scoring" && (
        <>
          <div className="two-column">
            {Object.entries({ Apps: appWeights, Games: gameWeights }).map(
              ([name, weights]) => (
                <section className="card" key={name}>
                  <div className="card-heading">
                    <h2>{name} · Version 1.0</h2>
                    <Badge value="Deterministic" />
                  </div>
                  {Object.entries(weights).map(([key, value]) => (
                    <div className="setting-row" key={key}>
                      <span>{human(key)}</span>
                      <b>{value}%</b>
                    </div>
                  ))}
                </section>
              ),
            )}
          </div>
          <form
            className="card settings-form"
            onSubmit={(e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              save("/settings", {
                idea_of_day_min_score: Number(f.get("score")),
                idea_of_day_min_confidence: Number(f.get("confidence")),
              });
            }}
          >
            <h2>Daily promotion thresholds</h2>
            <div className="form-grid">
              <label>
                Minimum opportunity score
                <input
                  type="number"
                  name="score"
                  min="0"
                  max="100"
                  defaultValue={s.idea_of_day_min_score}
                />
              </label>
              <label>
                Minimum research confidence
                <input
                  type="number"
                  name="confidence"
                  min="0"
                  max="100"
                  defaultValue={s.idea_of_day_min_confidence}
                />
              </label>
            </div>
            <button className="button primary">Save thresholds</button>
          </form>
        </>
      )}
      {!aiPage && section === "development-profile" && (
        <form
          className="card settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            save("/settings", {
              development_profile: {
                ...s.development_profile,
                framework: "Flutter",
                targets: ["iOS", "Android"],
                primary_downstream_agent: f.get("agent"),
                preferences: f.get("preferences"),
              },
            });
          }}
        >
          <h2>Downstream development profile</h2>
          <p className="muted">
            Blueprints describe Flutter apps for Android and iOS. Production
            source code is built by your coding agent.
          </p>
          <label>
            Default coding agent
            <select
              name="agent"
              defaultValue={
                s.development_profile.primary_downstream_agent || "Claude Code"
              }
            >
              {["Claude Code", "Codex", "Kimi", "Gemini CLI"].map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </label>
          <label>
            Architecture and design preferences
            <textarea
              name="preferences"
              defaultValue={s.development_profile.preferences || ""}
              placeholder="Your preferred architecture, offline behavior, visual principles…"
            />
          </label>
          <button className="button primary">Save profile</button>
        </form>
      )}
      {!aiPage && section === "figma" && (
        <section className="card prose-card">
          <h2>Editable Figma handoff</h2>
          <p>
            Export a prototype payload from a project, then import it using the
            companion Figma plugin. Screen IDs connect editable frames to the
            originating Blueprint version.
          </p>
          <ol>
            <li>Download and unzip the companion plugin.</li>
            <li>
              In Figma, import the development plugin using its manifest.json.
            </li>
            <li>Open your project prototype and choose Figma handoff.</li>
            <li>
              Paste the JSON payload in the plugin and create editable frames.
            </li>
          </ol>
          <a href="/figma-plugin.zip" className="button primary" download>
            Download Figma plugin
            <ExternalLink size={15} />
          </a>
        </section>
      )}
      {!aiPage && section === "integrations" && (
        <section className="card">
          <div className="card-heading">
            <h2>Integration status</h2>
          </div>
          {[
            ["Supabase", "Connected"],
            [
              "OpenRouter",
              d.integrations.openrouter ? "Configured" : "Missing server key",
            ],
            ["Figma", "Plugin handoff"],
            ["Paid data providers", "Disabled by default"],
          ].map(([name, status]) => (
            <div className="setting-row" key={name}>
              <b>{name}</b>
              <Badge value={status} />
            </div>
          ))}
          <div className="callout">
            Provider keys stay on the server. Model choices and research budgets
            can be changed in this workspace.
          </div>
        </section>
      )}
      {!aiPage && section === "account" && (
        <form
          className="card settings-form"
          onSubmit={(e) => {
            e.preventDefault();
            save("/profile", {
              display_name: new FormData(e.currentTarget).get("name"),
            });
          }}
        >
          <h2>Your account</h2>
          <label>
            Display name
            <input
              name="name"
              defaultValue={d.profile.display_name || ""}
              maxLength={80}
              required
            />
          </label>
          <button className="button primary">Save account</button>
        </form>
      )}
      {aiPage && !["prompts", "usage"].includes(section) && (
        <section className="card">
          <div className="card-heading">
            <h2>Role-based model routing</h2>
            <p>
              Each role has a focused contract and its own model configuration.
            </p>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>AI role</th>
                  <th>Model</th>
                  <th>Call budget</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {d.roles.map((r: Row) => (
                  <tr key={r.id}>
                    <td>
                      <b>{human(r.role_key)}</b>
                    </td>
                    <td className="mono">
                      {r.primary_model || "Choose a model"}
                    </td>
                    <td>{money(r.max_cost_per_call_usd)}</td>
                    <td>
                      <Badge
                        value={
                          !r.enabled
                            ? "Disabled"
                            : r.primary_model
                              ? "Configured"
                              : "Not configured"
                        }
                      />
                    </td>
                    <td>
                      <button
                        className="button small"
                        onClick={() => setEditRole(r)}
                      >
                        <SlidersHorizontal size={14} />
                        Configure
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {aiPage && section === "usage" && (
        <section className="card">
          <div className="card-heading">
            <h2>AI invocation ledger</h2>
            <span>Latest 30 calls</span>
          </div>
          {usages.data?.items?.length ? (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Role</th>
                    <th>Model</th>
                    <th>Tokens in / out</th>
                    <th>Cost</th>
                    <th>Status</th>
                    <th>Time</th>
                  </tr>
                </thead>
                <tbody>
                  {usages.data.items.map((i: Row) => (
                    <tr key={i.id}>
                      <td>{human(i.role_key)}</td>
                      <td>
                        {i.resolved_model || i.requested_model || "Pending"}
                      </td>
                      <td>
                        {i.input_tokens ?? "—"} / {i.output_tokens ?? "—"}
                      </td>
                      <td>{money(Number(i.cost_usd))}</td>
                      <td>
                        <Badge value={i.status} />
                      </td>
                      <td>{date(i.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <Empty
              title="No AI usage yet"
              text="Real invocations are recorded here, including failures and reserved spend."
            />
          )}
        </section>
      )}
      {aiPage && section === "prompts" && (
        <section className="card">
          <div className="card-heading">
            <h2>Prompt versions</h2>
            <button className="button" onClick={() => setPrompt(true)}>
              <Plus size={15} />
              New version
            </button>
          </div>
          {prompts.data?.items?.length ? (
            prompts.data.items.map((p: Row) => (
              <div className="prose-card" key={p.id}>
                <h3>
                  {human(p.role_key)} · {p.version}
                </h3>
                <Badge value={p.is_active ? "Active" : "Draft"} />
                {!p.is_active && (
                  <button
                    className="button small"
                    onClick={() =>
                      save("/prompts/" + p.id + "/activate", {}, "POST")
                    }
                  >
                    Activate version
                  </button>
                )}
                <p className="pre-wrap">{p.template}</p>
              </div>
            ))
          ) : (
            <Empty
              title="Default role contracts are active"
              text="Create a prompt version to add custom guidance for a role."
            />
          )}
        </section>
      )}
      {editRole && (
        <Dialog
          title={"Configure " + human(editRole.role_key)}
          onClose={() => setEditRole(null)}
        >
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = await save("/roles/" + editRole.id, {
                primary_model: f.get("model"),
                enabled: f.get("enabled") === "on",
                max_cost_per_call_usd: Number(f.get("cost")),
                daily_call_limit: Number(f.get("call_limit")),
                daily_budget_usd:
                  String(f.get("role_daily") || "").trim() === ""
                    ? null
                    : Number(f.get("role_daily")),
                fallback_models: String(f.get("fallbacks"))
                  .split(",")
                  .map((s) => s.trim())
                  .filter(Boolean),
                settings: {
                  temperature: Number(f.get("temp")),
                  max_tokens: Number(f.get("tokens")),
                },
              });
              if (ok) setEditRole(null);
            }}
          >
            <label>
              Primary model
              <input
                name="model"
                defaultValue={editRole.primary_model || ""}
                list="model-list"
                required
              />
              <datalist id="model-list">
                {modelQuery.data?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </datalist>
            </label>
            <label>
              Fallback model IDs (comma separated)
              <input
                name="fallbacks"
                defaultValue={(editRole.fallback_models || []).join(", ")}
              />
            </label>
            <div className="form-grid">
              <label>
                Maximum cost per call
                <input
                  name="cost"
                  type="number"
                  min="0"
                  max="5"
                  step="0.001"
                  defaultValue={editRole.max_cost_per_call_usd ?? 0.15}
                />
              </label>
              <label>
                Maximum output tokens
                <input
                  name="tokens"
                  type="number"
                  min="256"
                  max="16000"
                  defaultValue={editRole.settings?.max_tokens || 12000}
                />
              </label>
              <label>
                Temperature
                <input
                  name="temp"
                  type="number"
                  min="0"
                  max="2"
                  step="0.05"
                  defaultValue={editRole.settings?.temperature ?? 0.15}
                />
              </label>
            </div>
            <label>
              Daily call limit
              <input
                name="call_limit"
                type="number"
                min="1"
                max="10000"
                step="1"
                required
                defaultValue={editRole.daily_call_limit ?? 200}
              />
            </label>
            <label>
              Daily role budget (USD, blank uses workspace limit)
              <input
                name="role_daily"
                type="number"
                min="0"
                max="100"
                step="0.001"
                defaultValue={editRole.daily_budget_usd ?? ""}
              />
              <small className="muted">
                Zero blocks paid calls for this role. Workspace and run budgets
                still apply.
              </small>
            </label>
            <label className="check-label">
              <input
                type="checkbox"
                name="enabled"
                defaultChecked={editRole.enabled}
              />
              Enabled
            </label>
            <div className="dialog-actions">
              <button className="button primary">Save role</button>
            </div>
          </form>
        </Dialog>
      )}
      {prompt && (
        <Dialog title="New prompt version" onClose={() => setPrompt(false)}>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              const f = new FormData(e.currentTarget);
              const ok = await save(
                "/prompts",
                {
                  role_key: f.get("role"),
                  version: f.get("version"),
                  template: f.get("template"),
                },
                "POST",
              );
              if (ok) setPrompt(false);
            }}
          >
            <label>
              Role
              <select name="role">
                {d.roles.map((r: Row) => (
                  <option key={r.id}>{r.role_key}</option>
                ))}
              </select>
            </label>
            <label>
              Version
              <input name="version" placeholder="1.1" required />
            </label>
            <label>
              Additional role guidance
              <textarea name="template" minLength={10} required />
            </label>
            <button className="button primary">Create version</button>
          </form>
        </Dialog>
      )}
    </>
  );
}
