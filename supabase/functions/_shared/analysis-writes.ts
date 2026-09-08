import type { Row, Store } from "./store.ts";

// Build a complete write set in memory. Only center_commit_analysis can publish it.
export class AnalysisWrites {
  readonly writes: {
    table: string;
    row: Row;
    conflict: string;
    operation: "upsert" | "update";
  }[] = [];
  constructor(private store: Store) {}
  async put(table: string, row: Row, conflict = "id") {
    const data: Row = { ...row, owner_id: this.store.owner };
    if (conflict === "id" && !data.id) data.id = crypto.randomUUID();
    this.writes.push({ table, row: data, conflict, operation: "upsert" });
    return data as Row;
  }
  async update(table: string, id: string, patch: Row) {
    const row = { ...patch, id, owner_id: this.store.owner };
    this.writes.push({ table, row, conflict: "id", operation: "update" });
    return row;
  }
  async commit(job: Row, result: Row) {
    return this.store.rpc("center_commit_analysis", {
      p_owner: this.store.owner,
      p_job: job.id,
      p_attempt: job.attempt_count,
      p_writes: this.writes,
      p_result: result,
    });
  }
}
