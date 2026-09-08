import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { FlaskConical } from "lucide-react";
import { api, money } from "../lib/client";
import { Dialog, ErrorBox } from "../components/ui";
export default function ResearchDialog({
  onClose,
  conceptId,
  title,
  initialMarket,
}: {
  onClose: () => void;
  conceptId?: string;
  title?: string;
  initialMarket?: string;
}) {
  const nav = useNavigate(),
    qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api("/bootstrap"),
  });
  const [query, setQuery] = useState(title || ""),
    [market, setMarket] = useState(initialMarket || "GLOBAL"),
    [budget, setBudget] = useState(""),
    [requestKey] = useState(() => crypto.randomUUID());
  const budgetCap = Number(data?.settings?.research_config?.run_budget ?? 0.5);
  const mutation = useMutation({
    mutationFn: () =>
      api(conceptId ? `/ideas/${conceptId}/refresh` : "/research", "POST", {
        query:
          query ||
          data?.settings?.research_config?.query ||
          "mobile productivity",
        market,
        request_key: requestKey,
        run_budget: budget === "" ? budgetCap : Number(budget),
        ...(conceptId ? {} : { max_items: 12 }),
      }),
    onSuccess: (result) => {
      qc.invalidateQueries();
      onClose();
      nav("/research/runs/" + result.id);
    },
  });
  return (
    <Dialog
      title={conceptId ? "Refresh this idea" : "Start a research run"}
      onClose={onClose}
    >
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <p className="muted">
          {conceptId
            ? "Collect fresh evidence and reanalyze this concept. Prior research and published blueprints remain preserved. Imported reviews linked to this idea are included."
            : "Collect fresh evidence, discover opportunities and analyze the strongest candidates."}
        </p>
        <label>
          Research focus
          <input
            placeholder={
              data?.settings?.research_config?.query || "e.g. habit tracking"
            }
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            maxLength={120}
          />
        </label>
        <label>
          Target market
          <select value={market} onChange={(e) => setMarket(e.target.value)}>
            {data?.markets?.map((m: any) => (
              <option key={m.id} value={m.code}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Maximum run spend (USD)
          <input
            type="number"
            min="0"
            max={10}
            step="0.01"
            value={budget}
            placeholder={String(budgetCap)}
            onChange={(e) => setBudget(e.target.value)}
          />
        </label>
        <div className="callout">
          <b>Budget cap: {money(budget === "" ? budgetCap : Number(budget))}</b>
          <p>
            {data?.sources?.filter((s: any) => s.enabled).length || 0} enabled
            sources · Up to {data?.settings?.max_deep_candidates || 2} deep
            candidates. Missing data will remain unknown.
          </p>
          {market === "GLOBAL" && (
            <p>
              Apple collection samples the US storefront. Other countries are
              not implied by this sample.
            </p>
          )}
        </div>
        {mutation.error && <ErrorBox error={mutation.error} />}
        <div className="dialog-actions">
          <button type="button" className="button" onClick={onClose}>
            Cancel
          </button>
          <button className="button primary" disabled={mutation.isPending}>
            <FlaskConical size={16} />
            {mutation.isPending ? "Starting…" : "Start research"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
