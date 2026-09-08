import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router";
import { FlaskConical } from "lucide-react";
import { api, money } from "../lib/client";
import { Dialog, ErrorBox } from "../components/ui";
export default function ResearchDialog({ onClose }: { onClose: () => void }) {
  const nav = useNavigate(),
    qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ["bootstrap"],
    queryFn: () => api("/bootstrap"),
  });
  const [query, setQuery] = useState(""),
    [market, setMarket] = useState("GLOBAL");
  const mutation = useMutation({
    mutationFn: () =>
      api("/research", "POST", {
        query:
          query ||
          data?.settings?.research_config?.query ||
          "mobile productivity",
        market,
        request_key: crypto.randomUUID(),
        max_items: 12,
      }),
    onSuccess: (result) => {
      qc.invalidateQueries();
      onClose();
      nav("/research/runs/" + result.id);
    },
  });
  return (
    <Dialog title="Start a research run" onClose={onClose}>
      <form
        onSubmit={(e: FormEvent) => {
          e.preventDefault();
          mutation.mutate();
        }}
      >
        <p className="muted">
          Collect fresh evidence, discover opportunities and analyze the
          strongest candidates.
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
        <div className="callout">
          <b>
            Budget cap:{" "}
            {money(data?.settings?.research_config?.run_budget || 0.5)}
          </b>
          <p>
            {data?.sources?.filter((s: any) => s.enabled).length || 0} enabled
            sources · Up to {data?.settings?.max_deep_candidates || 2} deep
            candidates. Missing data will remain unknown.
          </p>
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
